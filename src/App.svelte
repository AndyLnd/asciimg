<script lang="ts">
  import {writable} from 'svelte/store';
  import {startCam, stopCam, fileToAscii} from './asciiimg';
  import {startBlobs, stopBlobs} from './blobs';
  import Slider from './Slider.svelte';
  import GhLink from './GhLink.svelte';

  enum STATE {
    IMAGE,
    CAM,
    BLOBS,
  }

  let state = STATE.IMAGE;
  let ascii = writable('');
  let contrast = writable(25);
  let threshold = writable(128);
  let files: FileList;

  const toggleState = (newState: STATE) => (state = state === newState ? STATE.IMAGE : newState);

  $: state === STATE.IMAGE && files && fileToAscii(files[0], $contrast, $threshold).then((res) => ascii.set(res));

  $: if (state === STATE.CAM) {
    startCam(ascii, contrast, threshold);
  } else {
    stopCam();
    ascii.set('');
  }

  $: if (state === STATE.BLOBS) {
    startBlobs(ascii);
  } else {
    stopBlobs();
    ascii.set('');
  }
</script>

<section>
  <h2>Ascii Cam</h2>
  <div class="buttons">
    <label
      class="button"
      on:change={() => {
        state = STATE.IMAGE;
      }}
    >
      From file
      <input type="file" accept="image/*" bind:files />
    </label>
    <div class="button" on:click={() => toggleState(STATE.CAM)}>
      {state === STATE.CAM ? 'Stop webcam' : 'Start webcam'}
    </div>
    <div class="button" on:click={() => toggleState(STATE.BLOBS)}>
      {state === STATE.BLOBS ? 'Stop blobs' : 'Start blobs'}
    </div>
  </div>
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
    grid: auto auto 1fr auto / 1fr auto auto auto 1fr;
    gap: 16px;
    height: 100%;
  }
  h2 {
    grid-column: 1/-1;
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
    margin: 4px;
    background-color: #eee;
    cursor: pointer;
    max-width: 120px;
    width: 120px;
  }
  .button:hover {
    background-color: #fff;
  }

  .buttons {
    grid-column: 2/3;
  }
  footer {
    justify-self: center;
    grid-column: 1/-1;
  }
</style>
