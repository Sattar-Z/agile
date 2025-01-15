<template>
  <div class="layout-wrapper layout-blank">
    <RouterView />
  </div>
</template>

<style>
.layout-wrapper.layout-blank {
  flex-direction: column;
  background-image: url("/src/assets/images/back5.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  block-size: 100vh;
}
</style>
