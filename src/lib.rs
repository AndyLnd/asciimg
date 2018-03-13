#![feature(proc_macro)]

extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

fn sq_dist(ar1: &[i32], ar2: &[i32]) -> i32 {
  ar1.iter().zip(ar2).fold(0i32, |acc, (&v1, &v2)| acc + ((v1-v2)*(v1-v2)))
}

fn find_closest_char(m: &[i32], chars: &[i32], char_count: usize) -> usize {
  let mut min_dist = i32::max_value();
  let mut min_char = 0usize;
  let char_size = chars.len() / char_count;
  for pointer in 0..char_count{
    let offset = pointer * char_size;
    let dist = sq_dist(m, &chars[offset..(offset+char_size)]);
    if dist < min_dist {
      min_dist = dist;
      min_char = pointer;
    }
  }
  min_char
}

#[wasm_bindgen]
#[no_mangle]
pub extern fn make_ascii(img: &[u8], iw: usize, ih: usize, chars: &[i32], cw: usize, ch: usize, char_list: &str, char_count: usize, contrast: i32, threshold: i32) -> String{
  let grey_image = get_grey_image (img, iw, ih, cw, ch, contrast, threshold);
  let line_length = iw / cw;
  let block_length = cw * ch;
  let mut out_s = String::with_capacity(iw / cw * ih / ch);

  for pos in 0 .. grey_image.len() / block_length {
    if pos > 0 && pos % line_length == 0 {
      out_s.push('\n');
    }

    let offset = pos * block_length;
    let img_slice = &grey_image[offset..offset+block_length];
    let closest_char = find_closest_char(img_slice, chars, char_count);
    out_s.push(char_list.chars().nth(closest_char).unwrap());
  }
  out_s
}

fn get_grey_image (img: &[u8], iw: usize, ih: usize, cw: usize, ch: usize, contrast: i32, threshold: i32) -> Vec<i32>{
  let width = (iw / cw) * cw;
  let height = (ih / ch) * ch;
  let character_length = cw * ch;
  let mut grey_image = vec![0i32; width * height];
  let mut offset = 0usize;
  let contrast = ((100f32 + contrast as f32) / 100f32).powi(2);
  for y in 0..(ih / ch) {
    for x in 0..(iw / cw) {
      let img_slice = get_slice_of_img(img, iw, x, y, cw, ch);
      for (i, val) in img_slice.iter().enumerate() {
        grey_image[i + offset] = calc_contrast(*val, contrast, threshold as f32);
      }
      offset += character_length;
    }
  }
  grey_image
}

fn get_slice_of_img (img: &[u8], iw: usize, x: usize, y: usize, w: usize, h: usize) -> Vec<i32>{
  let mut slice = vec![0i32; w * h];
  let start_x = x * w;
  let start_y = y * h;
  let mut count = 0;
  for iy in start_y..start_y+h {
    for ix in start_x..start_x+w{
      let pos = (iy * iw + ix) * 4;
      slice[count] = (img[pos] as f32 * 0.2126 + img[pos+1] as f32 * 0.7152 + img[pos+2] as f32 * 0.0722) as i32;
      count += 1;
    }
  }
  slice
}

fn calc_contrast (val: i32, contrast: f32, threshold: f32) -> i32 {
  let val = ((val as f32 - threshold) * contrast + threshold) as i32;
  if val < 0 {
    return 0;
  }
  if val > 255 {
    return 255;
  }
  val
}

fn bit_diff(ar1: &[u16], ar2: &[u16]) -> u32{
  ar1.iter().zip(ar2).fold(0u32, |acc, (&v1, &v2)| acc + (v1 ^ v2).count_ones())
}

fn closest_bit_char (m: &[u16], chars: &[u16], char_count: usize, ch: usize) -> usize {
  let mut min_diff = u32::max_value();
  let mut min_char = 0usize;
  for pointer in 0..char_count{
    let offset = pointer * ch;
    let diff = bit_diff(m, &chars[offset..(offset + ch)]);
    if diff < min_diff {
      min_diff = diff;
      min_char = pointer;
    }
  }
  min_char
}

#[wasm_bindgen]
#[no_mangle]
pub extern fn make_ascii_2(img: &[u8], iw: usize, ih: usize, cimg: &[u8], cw: usize, ch: usize, char_list: &str, char_count: usize) -> String {

  let img_map = get_floyd_steinberg(img, iw, ih, cw, ch);
  let char_map = get_floyd_steinberg(cimg, cw * char_count, ch, cw, ch);
  let line_length = iw / cw;
  let mut out_s = String::with_capacity(line_length * ih / ch);
  for i in 0..img_map.len() / ch {
    if i > 0 && i % line_length == 0 {
      out_s.push('\n');
    }
    let offset = i * ch;
    let img_slice = &img_map[offset..offset+ch];
    let closest_char = closest_bit_char(img_slice, &char_map, char_count, ch);
    out_s.push(char_list.chars().nth(closest_char).unwrap());
  }
  out_s
}


fn get_floyd_steinberg(img: &[u8], iw: usize, ih: usize, cw: usize, ch: usize) -> Vec<u16>{
  let w = (iw / cw) * cw;
  let h = (ih / ch) * ch;

  let blocks_per_line = w / cw;
  let mut floyd_steinberg_map = vec![0u16; blocks_per_line * h];
  let mut grey_map = vec![0f32; w * h];
  for i in 0..w * h {
    let pos = ((i%w) + (i/w) * iw) * 4;
    grey_map[i] = (img[pos] as f32 * 0.2126 + img[pos+1] as f32 * 0.7152 + img[pos+2] as f32 * 0.0722) / 255.0;
  }

  for i in 0..w * h {
    let x = i % w;
    let y = i / w;
    let mut new_val = 1u16;
    if grey_map[i] < 0.5 {
      new_val = 0u16;
    }
    let block_num = x / cw + (y / ch) * blocks_per_line;
    let offset = block_num * ch + y % ch;
    floyd_steinberg_map[offset] |= new_val << (x % cw);
    let error = grey_map[i] - new_val as f32;

    if x < w - 1 {
      grey_map[i + 1] += error * (7.0 / 16.0);
    }

    if y < h - 1 {
      grey_map[i + w] += error * (5.0 / 16.0);
      if x > 0 {
        grey_map[i + w - 1] += error * (3.0 / 16.0);
      }
      if x < w - 1 {
        grey_map[i + w + 1] += error * (1.0 / 16.0);
      }
    }
  }

  floyd_steinberg_map
}
