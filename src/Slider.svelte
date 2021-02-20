<script lang="ts">
  export let name = '';
  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let disabled = false;
</script>

<div>
  <div class:disabled>{name}: {value}</div>
  <input type="range" {min} {max} {disabled} bind:value />
</div>

<style>
  div {
    max-width: 120px;
    align-self: center;
  }
  .disabled {
    opacity: .5;
  }
  input {
    width: 100%;
  }
</style>
