<script lang="ts">
  import {writable} from 'svelte/store';
  import {startCam, stopCam, fileToAscii} from './asciiimg';
  import Slider from './Slider.svelte';
  import GhLink from './GhLink.svelte';

  let ascii = writable('');
  let contrast = writable(25);
  let threshold = writable(128);
  let files: FileList;
  let useCam = false;

  $: files && fileToAscii(files[0], $contrast, $threshold).then((res) => ascii.set(res));
  $: if (useCam) {
    startCam(ascii, contrast, threshold);
  } else {
    stopCam();
    ascii.set('');
  }
</script>

<section>
  <h4>ascii image</h4>
  <label class="button" on:change={() => (useCam = false)}>
    {'From file'}
    <input type="file" accept="image/*" bind:files />
  </label>
  <div class="button" on:click={() => (useCam = !useCam)}>{useCam ? 'Stop webcam' : 'Use webcam'}</div>
  <Slider name="Contrast" min={-100} max={100} bind:value={$contrast} />
  <Slider name="Threshold" min={0} max={255} bind:value={$threshold} />
  <pre>{$ascii}</pre>
  <footer>
    made with <GhLink repo="rust-lang/rust">rust</GhLink>, <GhLink repo="rustwasm/wasm-bindgen">wasm-bindgen</GhLink> & <GhLink
      repo="sveltejs/svelte">svelte</GhLink
    > &mdash; <GhLink repo="andylnd/asciimg">github repo</GhLink>
  </footer>
</section>

<style>
  pre {
    font-size: 8px;
    font-family: monospace;
    grid-column: 1/-1;
    justify-self: center;
  }

  section {
    display: grid;
    grid: auto auto 1fr auto / 1fr 1fr 1fr 1fr;
    gap: 16px;
    height: 100%;
  }
  h4 {
    grid-column: span 4;
    text-align: center;
  }
  label > input {
    display: none;
  }
  .button {
    display: block;
    border: 2px solid black;
    border-radius: 0;
    margin: 0;
    text-align: center;
    padding: 8px;
    background-color: #eee;
    cursor: pointer;
  }
  .button:hover {
    background-color: #fff;
  }
  footer {
    justify-self: center;
    grid-column: 1/-1;
  }
</style>
