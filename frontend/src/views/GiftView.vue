<template>
  <div class="gift-public" dir="rtl">
    <div class="card">
      <h1 class="couple">{{ data.name1 }} & {{ data.name2 }}</h1>
      <p class="lead">שלח מתנה דיגיטלית 💝</p>
      <form @submit.prevent="submit">
        <div class="form-group"><label>שם</label><input v-model="form.name" required class="form-input"/></div>
        <div class="form-group"><label>ברכה</label><textarea v-model="form.message" class="form-input"/></div>
        <div class="form-group"><label>סכום (₪)</label><input v-model.number="form.amount" type="number" class="form-input"/></div>
        <div class="actions"><button class="btn btn-primary">שלח תודה</button></div>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const data = ref({name1:'',name2:'',weddingDate:'',venue:''})
const form = ref({name:'',message:'',amount:null})
async function load(){ const res=await fetch(`/api/gift/${route.params.token}`); if(res.ok) data.value=await res.json() }
async function submit(){ await fetch(`/api/gift/${route.params.token}/submit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form.value)}); alert('תודה!') }
onMounted(load)
</script>
<style scoped>
.gift-public{display:flex;align-items:center;justify-content:center;padding:var(--space-8)}
.card{background:var(--color-bg-card);padding:var(--space-6);border-radius:var(--radius-xl);max-width:560px}
.lead{color:var(--color-text-muted)}
.form-group{margin-bottom:var(--space-3)}
.form-input{width:100%;padding:8px}
</style>