cargo build --release --target wasm32-unknown-unknown
wasm-bindgen target/wasm32-unknown-unknown/release/ascii.wasm --out-dir html/wasm
wasm2es6js html/wasm/ascii_wasm.wasm -o html/wasm/ascii_wasm.js --base64
parcel html/ascii.html --open
