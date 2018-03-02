
            /* tslint:disable */
            import * as wasm from './ascii_wasm'; // imports from wasm file
            

            
            let cachedUint8Memory = null;
            function getUint8Memory() {
                if (cachedUint8Memory === null ||
                    cachedUint8Memory.buffer !== wasm.memory.buffer)
                    cachedUint8Memory = new Uint8Array(wasm.memory.buffer);
                return cachedUint8Memory;
            }
        
            function passArray8ToWasm(arg) {
                const ptr = wasm.__wbindgen_malloc(arg.byteLength);
                getUint8Memory().set(arg, ptr);
                return [ptr, arg.length];
            }
        
            let cachedUint32Memory = null;
            function getUint32Memory() {
                if (cachedUint32Memory === null ||
                    cachedUint32Memory.buffer !== wasm.memory.buffer)
                    cachedUint32Memory = new Uint32Array(wasm.memory.buffer);
                return cachedUint32Memory;
            }
        
            function passArray32ToWasm(arg) {
                const ptr = wasm.__wbindgen_malloc(arg.byteLength);
                getUint32Memory().set(arg, ptr / 4);
                return [ptr, arg.length];
            }
        
            let cachedEncoder = null;
            function textEncoder() {
                if (cachedEncoder)
                    return cachedEncoder;
                cachedEncoder = new TextEncoder('utf-8');
                return cachedEncoder;
            }
        
                function passStringToWasm(arg) {
                    if (typeof(arg) !== 'string')
                        throw new Error('expected a string argument');
                    const buf = textEncoder().encode(arg);
                    const len = buf.length;
                    const ptr = wasm.__wbindgen_malloc(len);
                    getUint8Memory().set(buf, ptr);
                    return [ptr, len];
                }
            
            let cachedDecoder = null;
            function textDecoder() {
                if (cachedDecoder)
                    return cachedDecoder;
                cachedDecoder = new TextDecoder('utf-8');
                return cachedDecoder;
            }
        
                function getStringFromWasm(ptr, len) {
                    const mem = getUint8Memory();
                    const slice = mem.slice(ptr, ptr + len);
                    const ret = textDecoder().decode(slice);
                    return ret;
                }
            export function make_ascii(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const [ptr0, len0] = passArray8ToWasm(arg0);
                    const [ptr3, len3] = passArray32ToWasm(arg3);
                    const [ptr6, len6] = passStringToWasm(arg6);
                    try {
                    const ret = wasm.make_ascii(ptr0, len0, arg1, arg2, ptr3, len3, arg4, arg5, ptr6, len6, arg7, arg8, arg9);
                    
                    const ptr = wasm.__wbindgen_boxed_str_ptr(ret);
                    const len = wasm.__wbindgen_boxed_str_len(ret);
                    const realRet = getStringFromWasm(ptr, len);
                    wasm.__wbindgen_boxed_str_free(ret);
                    return realRet;
                
                } finally {
                    
wasm.__wbindgen_free(ptr0, len0);

wasm.__wbindgen_free(ptr3, len3);

wasm.__wbindgen_free(ptr6, len6);

                }
            }
export const __wbindgen_throw = 
                    function(ptr, len) {
                        throw new Error(getStringFromWasm(ptr, len));
                    }
                ;

        