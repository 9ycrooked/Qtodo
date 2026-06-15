<template>
  <section class="page-view" aria-labelledby="settings-title">
    <header class="page-header">
      <h3 id="settings-title" class="page-name small">设置</h3>
    </header>

    <div class="page-placeholder">
      <p>这里放主题、偏好和应用设置。</p>
    </div>
  </section>
</template>

<style scoped>
.page-view {
  width: 100%;
  min-width: 0;
  padding: 24px;
}

.page-header {
  display: grid;
  gap: 6px;
  align-content: start;
  min-height: 58px;
}

.page-name {
  margin: 0;
  color: var(--primary);
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;
}

.page-placeholder {
  margin-top: 24px;
  padding: 18px;
  border-radius: 20px;
  background-color: var(--surface-container);
  color: var(--on-surface);
}

.page-placeholder p {
  margin: 0;
}
</style>
