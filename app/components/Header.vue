<template>
  <header class="site-header">
    <div class="site-header__inner">
      <h1 class="site-header__title">Väderkollen</h1>
    </div>
  </header>
</template>

<style scoped lang="scss">
.site-header {
  margin: 1rem auto 0.35rem;
  max-width: 1000px;
  padding: 0 1rem;

  &__inner {
    align-items: center;
    backdrop-filter: blur(6px);
    background: linear-gradient(165deg, #3b82f652 0%, #1d4ed852 58%, #1e3a8a66 100%);
    border: 1px solid #93c5fd66;
    border-radius: 14px;
    box-sizing: border-box;
    display: flex;
    justify-content: flex-start;
    min-height: 56px;
    padding: 0.6rem 0.9rem;
    box-shadow: 0 10px 24px #0206172e;
    width: 100%;
  }

  &__title {
    color: #eff6ff;
    font-size: 0.98rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin: 0;
    text-transform: uppercase;
    text-shadow: 0 2px 8px #0206179c;
  }
}

@media (max-width: 768px) {
  .site-header {
    display: none;
  }
}
</style>