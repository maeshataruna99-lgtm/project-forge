<script setup lang="ts">
import { computed, ref } from "vue";
import type { ProjectConfig, UiLayout } from "@project-forge/contracts";
import type { GenerationPlan } from "../api/generator";
import { GeneratorApiError } from "../api/generator";
import FileTree from "../components/FileTree.vue";
import LayoutPreview from "../components/LayoutPreview.vue";
import ThemePreview from "../components/ThemePreview.vue";
import { uiLayoutLabels } from "../domain/ui-layouts";
import type { GitHubAuthorization } from "../api/repository-output";

const props = defineProps<{
  config: ProjectConfig;
  plan?: GenerationPlan;
  validationError?: GeneratorApiError;
  archiveError?: GeneratorApiError;
  validating: boolean;
  archiveState: "idle" | "downloading" | "error" | "complete";
  githubState:
    | "idle"
    | "authorizing"
    | "awaiting"
    | "authorized"
    | "uploading"
    | "complete"
    | "error";
  githubAuthorization?: GitHubAuthorization;
  githubMessage?: string;
  githubRepositoryUrl?: string;
}>();
const emit = defineEmits<{
  validate: [];
  download: [];
  githubToggle: [enabled: boolean];
  githubAuthorize: [];
  githubCreate: [owner: string];
  githubCancel: [];
}>();
const settings = computed(() =>
  Object.entries(props.config)
    .filter(
      ([section]) =>
        section !== "schemaVersion" &&
        (section !== "ui" || props.config.stack.frontend === "vue-vite"),
    )
    .flatMap(([section, values]) =>
      Object.entries(values).map(([name, value]) => ({
        path: `${section}.${name}`,
        value:
          section === "ui" && name === "layout"
            ? uiLayoutLabels[value as UiLayout]
            : String(value),
      })),
    ),
);
const owner = ref("");
function issueFor(path: string) {
  return (
    props.validationError?.issues?.filter((issue) => issue.path === path) ?? []
  );
}
</script>

<template>
  <section aria-labelledby="review-heading">
    <h2 id="review-heading" tabindex="-1">Review and generate</h2>
    <p class="step-description">
      Check your choices and generated files before downloading.
    </p>
    <p v-if="config.dataMode === 'demo'" class="demo-data-notice" role="note">
      Demo data is saved only in this browser. It is not secure, shared, or
      durable. Server-side authentication and authorization are unavailable in
      this mode.
    </p>
    <dl class="review-summary">
      <div
        v-for="setting in settings"
        :key="setting.path"
        :data-config-path="setting.path"
      >
        <dt>{{ setting.path }}</dt>
        <dd>{{ setting.value }}</dd>
        <p
          v-for="(issue, index) in issueFor(setting.path)"
          :key="index"
          role="alert"
          class="field-error"
        >
          {{ issue.message }}
        </p>
      </div>
    </dl>
    <figure v-if="plan?.uiLayout" class="review-layout-preview">
      <figcaption>
        Generated UI layout: {{ uiLayoutLabels[plan.uiLayout] }}
      </figcaption>
      <LayoutPreview
        :layout="plan.uiLayout"
        :theme="config.theme"
        size="large"
      />
    </figure>
    <ThemePreview :theme="config.theme" />
    <p v-if="validating" role="status">Validating configuration…</p>
    <div v-if="validationError" role="alert" class="field-error">
      <p>{{ validationError.message }}</p>
      <ul v-if="validationError.issues?.length">
        <li v-for="(issue, index) in validationError.issues" :key="index">
          <strong>{{ issue.path }}:</strong> {{ issue.message }}
        </li>
      </ul>
      <p v-if="validationError.correlationId">
        Request ID: {{ validationError.correlationId }}
      </p>
    </div>
    <FileTree v-if="plan" :files="plan.files" />
    <div class="review-actions">
      <button
        type="button"
        class="button-secondary"
        :disabled="validating || archiveState === 'downloading'"
        @click="emit('validate')"
      >
        {{ validationError ? "Retry validation" : "Validate again" }}
      </button>
      <button
        type="button"
        class="button-primary"
        aria-label="Download ZIP archive"
        :disabled="!plan || validating || archiveState === 'downloading'"
        @click="emit('download')"
      >
        {{ archiveState === "downloading" ? "Preparing ZIP…" : "Download ZIP" }}
      </button>
    </div>
    <fieldset class="github-output">
      <legend>GitHub repository</legend>
      <label
        ><input
          type="checkbox"
          :checked="config.output.destination === 'github'"
          @change="
            emit('githubToggle', ($event.target as HTMLInputElement).checked)
          "
        />
        Create a public GitHub repository too</label
      >
      <p>
        ZIP download stays available. The public_repo permission covers public
        repositories your GitHub account can access. The API keeps the access
        token only in memory and discards it after one operation or expiry;
        GitHub may keep this app authorized until you revoke it in GitHub
        settings.
      </p>
      <button
        v-if="
          config.output.destination === 'github' &&
          (githubState === 'idle' || githubState === 'error')
        "
        type="button"
        class="button-secondary"
        :disabled="!plan || validating"
        @click="emit('githubAuthorize')"
      >
        {{ githubState === "error" ? "Reconnect GitHub" : "Connect GitHub" }}
      </button>
      <p v-else-if="githubState === 'authorizing'" role="status">
        Starting GitHub authorization…
      </p>
      <div
        v-else-if="githubState === 'awaiting' && githubAuthorization"
        class="github-device-code"
      >
        <p>
          Open
          <a
            :href="githubAuthorization.verificationUri"
            target="_blank"
            rel="noreferrer"
            >GitHub device authorization</a
          >
          and enter this code:
        </p>
        <strong>{{ githubAuthorization.userCode }}</strong>
        <p role="status">Waiting for GitHub approval…</p>
        <button
          type="button"
          class="button-secondary"
          @click="emit('githubCancel')"
        >
          Cancel authorization
        </button>
      </div>
      <div v-else-if="githubState === 'authorized'" class="github-create">
        <label for="github-owner">GitHub username or organization</label>
        <input
          id="github-owner"
          v-model="owner"
          autocomplete="off"
          required
          minlength="1"
          maxlength="39"
          pattern="[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
        />
        <p>
          Repository name: <strong>{{ config.project.name }}</strong
          >. Confirming below creates a public repository and pushes the
          generated files.
        </p>
        <button
          type="button"
          class="button-primary"
          :disabled="!plan || !owner.trim()"
          @click="emit('githubCreate', owner.trim())"
        >
          Create public repository and push files
        </button>
      </div>
      <p v-else-if="githubState === 'uploading'" role="status">
        Creating the repository and pushing project files…
      </p>
      <p v-if="githubMessage" role="alert" class="field-error">
        {{ githubMessage }}
      </p>
      <p v-if="githubRepositoryUrl" role="status">
        <a :href="githubRepositoryUrl" target="_blank" rel="noreferrer">{{
          githubRepositoryUrl
        }}</a>
      </p>
      <p v-if="githubState === 'complete'" role="status">
        Project files were pushed successfully.
      </p>
    </fieldset>
    <div v-if="archiveError" role="alert" class="field-error">
      <p>{{ archiveError.message }}</p>
      <p v-if="archiveError.correlationId">
        Request ID: {{ archiveError.correlationId }}
      </p>
    </div>
    <p v-if="archiveState === 'complete'" role="status">
      ZIP download started.
    </p>
  </section>
</template>
