<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

type HsvColor = { hue: number; saturation: number; brightness: number };
type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>;
};

const props = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  alignEnd?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const swatches = [
  "#2563EB",
  "#7F56D9",
  "#047857",
  "#F59E0B",
  "#E11D48",
  "#101828",
  "#FFFFFF",
];
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const area = ref<HTMLElement>();
const open = ref(false);
const eyeDropperAvailable = ref(false);
const hexDraft = ref(props.modelValue);
const invalidHex = ref(false);
const hsv = ref<HsvColor>(hexToHsv(props.modelValue));
let activePointer: number | undefined;

const areaStyle = computed(() => ({
  backgroundColor: `hsl(${hsv.value.hue} 100% 50%)`,
}));
const thumbStyle = computed(() => ({
  left: `${hsv.value.saturation}%`,
  top: `${100 - hsv.value.brightness}%`,
}));

watch(
  () => props.modelValue,
  (value) => {
    hexDraft.value = value;
    if (value.toLowerCase() !== hsvToHex(hsv.value).toLowerCase())
      hsv.value = hexToHsv(value);
    invalidHex.value = false;
  },
);

function hexToHsv(hex: string): HsvColor {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta !== 0) {
    if (maximum === red) hue = ((green - blue) / delta) % 6;
    else if (maximum === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return {
    hue: Math.round(hue),
    saturation: maximum === 0 ? 0 : Math.round((delta / maximum) * 100),
    brightness: Math.round(maximum * 100),
  };
}

function hsvToHex({ hue, saturation, brightness }: HsvColor): string {
  const chroma = (brightness / 100) * (saturation / 100);
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const offset = brightness / 100 - chroma;
  const channels =
    segment < 1
      ? [chroma, secondary, 0]
      : segment < 2
        ? [secondary, chroma, 0]
        : segment < 3
          ? [0, chroma, secondary]
          : segment < 4
            ? [0, secondary, chroma]
            : segment < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];
  return `#${channels
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

function selectColor(value: string) {
  hexDraft.value = value;
  invalidHex.value = false;
  hsv.value = hexToHsv(value);
  emit("update:modelValue", value);
}

function changeHsv(change: Partial<HsvColor>) {
  hsv.value = { ...hsv.value, ...change };
  const value = hsvToHex(hsv.value);
  hexDraft.value = value;
  invalidHex.value = false;
  emit("update:modelValue", value);
}

function changeHex(event: Event) {
  hexDraft.value = (event.target as HTMLInputElement).value;
  const candidate = hexDraft.value.trim();
  const normalized = candidate.startsWith("#") ? candidate : `#${candidate}`;
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    selectColor(normalized);
  }
}

function validateHex() {
  const candidate = hexDraft.value.trim();
  const normalized = candidate.startsWith("#") ? candidate : `#${candidate}`;
  invalidHex.value = !/^#[0-9a-fA-F]{6}$/.test(normalized);
  if (!invalidHex.value) selectColor(normalized);
}

function changeArea(event: PointerEvent) {
  if (!area.value) return;
  const bounds = area.value.getBoundingClientRect();
  changeHsv({
    saturation: Math.round(
      Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) *
        100,
    ),
    brightness: Math.round(
      (1 -
        Math.max(
          0,
          Math.min(1, (event.clientY - bounds.top) / bounds.height),
        )) *
        100,
    ),
  });
}

function startAreaDrag(event: PointerEvent) {
  if (!area.value) return;
  activePointer = event.pointerId;
  area.value.setPointerCapture(event.pointerId);
  changeArea(event);
}

function moveAreaDrag(event: PointerEvent) {
  if (event.pointerId === activePointer) changeArea(event);
}

function stopAreaDrag(event: PointerEvent) {
  if (event.pointerId !== activePointer) return;
  if (area.value?.hasPointerCapture(event.pointerId))
    area.value.releasePointerCapture(event.pointerId);
  activePointer = undefined;
}

async function pickFromScreen() {
  const EyeDropper = (window as Window & { EyeDropper?: EyeDropperConstructor })
    .EyeDropper;
  if (!EyeDropper) return;
  try {
    const result = await new EyeDropper().open();
    selectColor(result.sRGBHex.toUpperCase());
  } catch {
    // Closing the browser eyedropper leaves the current color unchanged.
  }
}

function closeOnOutsidePointer(event: PointerEvent) {
  if (open.value && !root.value?.contains(event.target as Node))
    open.value = false;
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== "Escape" || !open.value) return;
  open.value = false;
  trigger.value?.focus();
}

onMounted(() => {
  eyeDropperAvailable.value = "EyeDropper" in window;
  document.addEventListener("pointerdown", closeOnOutsidePointer);
  document.addEventListener("keydown", closeOnEscape);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeOnOutsidePointer);
  document.removeEventListener("keydown", closeOnEscape);
});
</script>

<template>
  <div
    ref="root"
    class="field color-picker"
    :class="{ 'color-picker--align-end': alignEnd }"
  >
    <label :for="id">{{ label }}</label>
    <div class="color-picker-control">
      <button
        ref="trigger"
        type="button"
        class="color-picker-trigger"
        :aria-label="`Open ${label} picker`"
        :aria-expanded="open"
        :aria-controls="`${id}-picker`"
        @click="open = !open"
      >
        <span
          class="color-picker-trigger__swatch"
          :style="{ backgroundColor: modelValue }"
        />
      </button>
      <input
        :id="id"
        class="color-picker-hex"
        type="text"
        :value="hexDraft"
        maxlength="7"
        autocomplete="off"
        spellcheck="false"
        :aria-invalid="invalidHex"
        :aria-describedby="invalidHex ? `${id}-error` : undefined"
        @input="changeHex"
        @blur="validateHex"
      />
    </div>
    <p v-if="invalidHex" :id="`${id}-error`" class="field-error" role="alert">
      Use a six-digit HEX color, such as #2563EB.
    </p>
    <div
      v-show="open"
      :id="`${id}-picker`"
      class="color-picker-panel"
      role="group"
      :aria-label="`${label} picker`"
    >
      <div
        ref="area"
        class="color-picker-area"
        :style="areaStyle"
        role="img"
        :aria-label="`Color area. Saturation ${hsv.saturation} percent, brightness ${hsv.brightness} percent. Use the sliders below for keyboard control.`"
        @pointerdown="startAreaDrag"
        @pointermove="moveAreaDrag"
        @pointerup="stopAreaDrag"
        @pointercancel="stopAreaDrag"
      >
        <span class="color-picker-area__white" />
        <span class="color-picker-area__black" />
        <span class="color-picker-area__thumb" :style="thumbStyle" />
      </div>
      <label :for="`${id}-hue`">Hue</label>
      <input
        :id="`${id}-hue`"
        class="color-picker-hue"
        type="range"
        min="0"
        max="359"
        :value="hsv.hue"
        @input="
          changeHsv({ hue: Number(($event.target as HTMLInputElement).value) })
        "
      />
      <div class="color-picker-adjustments">
        <label :for="`${id}-saturation`">Saturation</label>
        <output>{{ hsv.saturation }}%</output>
        <input
          :id="`${id}-saturation`"
          type="range"
          min="0"
          max="100"
          :value="hsv.saturation"
          @input="
            changeHsv({
              saturation: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
        <label :for="`${id}-brightness`">Brightness</label>
        <output>{{ hsv.brightness }}%</output>
        <input
          :id="`${id}-brightness`"
          type="range"
          min="0"
          max="100"
          :value="hsv.brightness"
          @input="
            changeHsv({
              brightness: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>
      <div
        class="color-picker-swatches"
        role="group"
        aria-label="Suggested colors"
      >
        <span>Suggested colors</span>
        <div>
          <button
            v-for="swatch in swatches"
            :key="swatch"
            type="button"
            class="color-picker-swatch"
            :style="{ backgroundColor: swatch }"
            :aria-label="`Use ${swatch} for ${label}`"
            :aria-pressed="modelValue.toLowerCase() === swatch.toLowerCase()"
            @click="selectColor(swatch)"
          />
        </div>
      </div>
      <button
        v-if="eyeDropperAvailable"
        type="button"
        class="color-picker-eyedropper"
        @click="pickFromScreen"
      >
        Pick color from screen
      </button>
    </div>
  </div>
</template>
