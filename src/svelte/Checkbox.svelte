<script lang="ts">
    import { Menu, MenuItem } from "obsidian-svelte";

    export let checked: boolean = false;
    export let onChange: (checked: boolean) => void;

    let random = (Math.random() * 10000000000).toString()
</script>

<div>
<div class="round">
    <input id={random} type="checkbox" checked={checked} on:change={() => onChange(!checked)}>
    <label for={random}></label>
</div>
</div>

<style>
.round {
  position: relative;
  height: 20px;
}

.round label {
  background-color: rgba(255,255,255,.05);
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  height: 20px;
  left: 0;
  position: absolute;
  top: 0;
  width: 20px;
}

.round label:after {
  border: 2px solid rgb(0,255,0);
  border-top: none;
  border-right: none;
  content: "";
  height: 6px;
  left: 4px;
  opacity: 0;
  position: absolute;
  top: 3px;
  transform: rotate(-45deg);
  width: 9px;
}

.round input[type="checkbox"] {
  visibility: hidden;
}

.round input[type="checkbox"]:checked + label {
  background-color: rgba(0,255,0, .05);
  border-color: rgb(0,255,0);
}

.round input[type="checkbox"]:checked + label:after {
  opacity: 1;
}
</style>
