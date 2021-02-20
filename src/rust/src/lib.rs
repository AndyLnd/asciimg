extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

fn sq_dist(ar1: &[i32], ar2: &[i32]) -> i32 {
  ar1
    .iter()
    .zip(ar2)
    .fold(0i32, |acc, (&v1, &v2)| acc + ((v1 - v2) * (v1 - v2)))
}

fn grey(r: u8, g: u8, b: u8) -> i32 {
  (r as f32 * 0.2126 + g as f32 * 0.7152 + b as f32 * 0.0722) as i32
}

fn find_closest_char(m: &[i32], chars: &[i32], char_count: usize) -> usize {
  let mut min_dist = i32::max_value();
  let mut min_char = 0usize;
  let char_size = chars.len() / char_count;
  for pointer in 0..char_count {
    let offset = pointer * char_size;
    let dist = sq_dist(m, &chars[offset..(offset + char_size)]);
    if dist < min_dist {
      min_dist = dist;
      min_char = pointer;
    }
  }
  min_char
}

#[wasm_bindgen]
pub fn make_ascii(
  img: &[u8],
  img_width: usize,
  img_height: usize,
  char_blocks: &[i32],
  block_width: usize,
  block_height: usize,
  contrast: i32,
  threshold: i32,
) -> Vec<i32> {
  let img_blocks = get_img_blocks(
    img,
    img_width,
    img_height,
    block_width,
    block_height,
    contrast,
    threshold,
  );
  let block_count_x = img_width / block_width;
  let block_count_y = img_height / block_height;
  let block_length = block_width * block_height;
  let char_count = char_blocks.len() / block_length;
  let mut out_s = Vec::with_capacity(block_count_x * block_count_y + block_count_y);

  for pos in 0..img_blocks.len() / block_length {
    if pos > 0 && pos % block_count_x == 0 {
      out_s.push(-1);
    }

    let offset = pos * block_length;
    let img_slice = &img_blocks[offset..offset + block_length];
    let closest_char = find_closest_char(img_slice, char_blocks, char_count);
    out_s.push(closest_char as i32);
  }
  out_s
}

fn get_img_blocks(
  img: &[u8],
  img_width: usize,
  img_height: usize,
  block_width: usize,
  block_height: usize,
  contrast: i32,
  threshold: i32,
) -> Vec<i32> {
  let block_count_x = img_width / block_width;
  let block_count_y = img_height / block_height;
  let width = block_count_x * block_width;
  let height = block_count_y * block_height;
  let character_length = block_width * block_height;
  let mut grey_image = vec![0i32; width * height];
  let mut offset = 0usize;
  let contrast = ((100f32 + contrast as f32) / 100f32).powi(2);
  for y in 0..block_count_y {
    for x in 0..block_count_x {
      let img_slice = get_block(img, img_width, block_width, block_height, x, y);
      for (i, val) in img_slice.iter().enumerate() {
        grey_image[i + offset] = calc_contrast(*val, contrast, threshold as f32);
      }
      offset += character_length;
    }
  }
  grey_image
}

#[wasm_bindgen]
pub fn get_char_blocks(
  char_img: &[u8],
  img_width: usize,
  char_width: usize,
  char_height: usize,
) -> Vec<i32> {
  get_img_blocks(
    char_img,
    img_width,
    char_height,
    char_width,
    char_height,
    1,
    0,
  )
}

fn get_block(
  image: &[u8],
  image_width: usize,
  block_width: usize,
  block_height: usize,
  x: usize,
  y: usize,
) -> Vec<i32> {
  let mut block = vec![0i32; block_width * block_height];
  let start_x = x * block_width;
  let start_y = y * block_height;
  let mut count = 0;
  for iy in start_y..start_y + block_height {
    for ix in start_x..start_x + block_width {
      let pos = (iy * image_width + ix) << 2;
      block[count] = grey(image[pos], image[pos + 1], image[pos + 2]);
      count += 1;
    }
  }
  block
}

fn calc_contrast(val: i32, contrast: f32, threshold: f32) -> i32 {
  let val = ((val as f32 - threshold) * contrast + threshold) as i32;
  if val < 0 {
    0
  } else if val > 255 {
    255
  } else {
    val
  }
}
/*
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
*/
