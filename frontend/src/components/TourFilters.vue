<template>
  <form class="tour-filters" @submit.prevent="$emit('apply')">
    <div class="filter-heading"><h2>Tìm chuyến đi phù hợp</h2><p>Lọc theo tên tour, ngân sách và ngày khởi hành.</p></div>
    <label class="keyword-field">Tên tour / điểm đến
      <input :value="modelValue.keyword" @input="update('keyword', $event.target.value)" type="search" placeholder="Sa Pa, Hà Giang, Hạ Long…" />
    </label>
    <label>Giá từ (VNĐ)
      <input 
        :value="formatInputThousands(modelValue.minPrice)" 
        @input="handlePriceInput('minPrice', $event)" 
        type="text" 
        inputmode="numeric" 
        placeholder="Ví dụ: 1.000.000" 
      />
    </label>
    <label>Giá đến (VNĐ)
      <input 
        :value="formatInputThousands(modelValue.maxPrice)" 
        @input="handlePriceInput('maxPrice', $event)" 
        type="text" 
        inputmode="numeric" 
        placeholder="Ví dụ: 10.000.000" 
      />
    </label>
    <label>Khởi hành từ<input :value="modelValue.startDate" @input="update('startDate', $event.target.value)" type="date" /></label>
    <label>Đến hết ngày<input :value="modelValue.endDate" @input="update('endDate', $event.target.value)" type="date" :min="modelValue.startDate || undefined" /></label>
    <div class="filter-actions"><button class="btn-apply" type="submit">Lọc kết quả</button><button class="btn-reset" type="button" @click="$emit('reset')">Đặt lại</button></div>
    <p v-if="error" class="filter-error" role="alert">{{ error }}</p>
  </form>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Object, required: true }, error: { type: String, default: '' } });
const emit = defineEmits(['update:modelValue', 'apply', 'reset']);
const update = (key, value) => emit('update:modelValue', { ...props.modelValue, [key]: value });

const formatInputThousands = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const handlePriceInput = (key, event) => {
  const rawValue = event.target.value.replace(/\D/g, '');
  update(key, rawValue);
  event.target.value = formatInputThousands(rawValue);
};
</script>

<style scoped>
.tour-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; padding: 28px; margin-bottom: 24px; background: #fff; border: 1px solid #d4e8e1; border-radius: 20px; box-shadow: 0 8px 30px #163d3210; }
.filter-heading { grid-column: 1 / -1; }
.filter-heading h2 { margin: 0 0 6px; color: #183d35; font-size: 1.35rem; }
.filter-heading p { margin: 0; color: #62766e; }
.tour-filters label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; font-size: .9rem; color: #294c42; }
.keyword-field { grid-column: span 2; }
.tour-filters input { width: 100%; min-width: 0; box-sizing: border-box; padding: 12px; border: 1px solid #cbded6; border-radius: 10px; font: inherit; color: #223d34; background: #fbfdfc; }
.tour-filters input:focus { outline: 2px solid #008c73; outline-offset: 2px; }
.filter-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; grid-column: span 2; }
.btn-apply, .btn-reset { padding: 12px 20px; border-radius: 10px; font: inherit; font-weight: 600; cursor: pointer; }
.btn-apply { border: 1px solid #007d68; background: #007d68; color: white; }
.btn-apply:hover { background: #006653; border-color: #006653; }
.btn-apply:focus-visible, .btn-reset:focus-visible { outline: 3px solid #00b99a; outline-offset: 3px; }
.btn-reset { border: 1px solid #cadfd5; background: white; color: #295c4c; }
.btn-reset:hover { background: #edf8f4; border-color: #007d68; }
.filter-error { grid-column: 1 / -1; margin: 0; color: #b42318; }
@media (max-width: 800px) { .tour-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 20px; } }
@media (max-width: 480px) { .tour-filters { grid-template-columns: 1fr; } .keyword-field, .filter-actions { grid-column: 1; } }
</style>
