<script lang="ts">
  import AutoValue from "svelte-tweakpane-ui/AutoValue.svelte";
  import Button from "svelte-tweakpane-ui/Button.svelte";
  import Separator from "svelte-tweakpane-ui/Separator.svelte";
  import Pane from "svelte-tweakpane-ui/Pane.svelte";
  import { persisted } from "svelte-local-storage-store";
  import type { Writable } from "svelte/store";
  import { onMount } from "svelte";

  // Helper functions
  function parseNumberOrReturnOriginal(string_: string): number | string {
    // Also strips suffixed units
    const parsed = Number.parseFloat(string_);
    return isNaN(parsed) ? string_ : parsed;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  async function copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`[tweakpane-css] Copied to clipboard:\n${text}`);
    } catch (error) {
      console.error(`[tweakpane-css] Failed to copy text: ${error}`);
    }
  }

  function cleanName(name: string): string {
    return name
      .replace("--", "")
      .replaceAll("-", " ")
      .replaceAll(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
      );
  }

  function getUnits(value: string): string {
    // Don't get confused by hex colors or complex expressions
    if (isNaN(Number.parseFloat(value))) return "";
    const match = /^(-?[\d.]+)\s?([%a-z]*)$/i.exec(value);
    return match?.[2] ? match[2] : "";
  }

  // Set up stores for local persistence
  let cssVariableStore: Writable<Record<string, number | string>>;

  onMount(() => {
    // Get all the root css variables
    const rootCssVariables: string[] = [...document.styleSheets]
      .flatMap((styleSheet: CSSStyleSheet) => [...styleSheet.cssRules])
      .filter(
        (cssRule: CSSRule): cssRule is CSSStyleRule =>
          cssRule instanceof CSSStyleRule && cssRule.selectorText === ":root"
      )
      .flatMap((cssRule: CSSStyleRule) => [...cssRule.style])
      .filter((style: string) => style.startsWith("--"));

    // Set up the persistent local store
    cssVariableStore = persisted(
      "css",
      rootCssVariables.reduce<Record<string, number | string>>(
        (acc, variableName) => {
          acc[variableName] = parseNumberOrReturnOriginal(
            window
              .getComputedStyle(document.documentElement)
              .getPropertyValue(variableName)
          );
          return acc;
        },
        {}
      )
    );

    // Clean up stale keys in the store
    for (const key of Object.keys(cssVariableStore)) {
      if (!rootCssVariables.includes(key)) {
        // TODO revisit $?
        delete $cssVariableStore[key];
      }
    }
  });

  // Buttons
  function onCopyCss() {
    const directives = Object.entries($cssVariableStore).map(
      ([variableName, value]) => {
        const units = getUnits(
          window
            .getComputedStyle(document.documentElement)
            .getPropertyValue(variableName)
        );
        return `\t${variableName}: ${value}${units ? `${units}` : ""};\n`;
      }
    );

    void copyToClipboard(`:root {\n${directives.join("")}}`);
  }

  function onReset() {
    console.log(`[tweakpane-css] Clearing changes to CSS Variables`);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("css");
      location.reload();
    }
  }

  // Reactive
  $: if (cssVariableStore) {
    // Set the css variables on the document, appending the original unit if needed
    for (const variableName of Object.keys($cssVariableStore)) {
      const units = getUnits(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue(variableName)
      );

      document.documentElement.style.setProperty(
        variableName,
        `${$cssVariableStore[variableName]}${units ? `${units}` : ""}`
      );
    }
  }
</script>

<Pane title="Tweakpane CSS">
  {#if cssVariableStore}
    {#each Object.keys($cssVariableStore) as variableName}
      {@const originalValue = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)}
      {@const units = getUnits(originalValue)}
      <AutoValue
        label={`${cleanName(variableName)}${units ? ` (${units})` : ""}`}
        bind:value={$cssVariableStore[variableName]}
      />
    {/each}
  {/if}
  <Separator />
  <Button title="Copy" on:click={onCopyCss} />
  <Button title="Reset" on:click={onReset} />
</Pane>
