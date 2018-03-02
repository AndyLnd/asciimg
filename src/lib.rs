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
