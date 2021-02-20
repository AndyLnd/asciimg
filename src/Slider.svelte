<script lang="ts">
  export let name = '';
  export let value = 0;
  export let min = 0;
  export let max = 100;
</script>

<div>
  <div>{name}: {value}</div>
  <input type="range" {min} {max} bind:value />
</div>

<style>
  div {
    max-width: 120px;
    align-self: center;
  }
  input {
    width: 100%;
  }
</style>
