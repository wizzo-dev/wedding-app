<template>
  <div class="rsvp-public" dir="rtl">
    <div class="card">
      <h1 class="couple">{{ data.name1 }} & {{ data.name2 }}</h1>
      <p class="date">{{ formatDate(data.weddingDate) }} · {{ data.venue }}</p>
      <div class="hero-img">📷</div>
      <div v-if="!submitted" class="cta-row">
        <button @click="respond('confirmed')" class="btn btn-primary">מגיעים</button>
        <button @click="respond('pending')" class="btn btn-outline">מתלבטים</button>
        <button @click="respond('declined')" class="btn btn-danger">לא מגיע</button>
      </div>
      <div v-else class="thank">תודה! התשובה נשלחה.</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const data = ref({name1:'',name2:'',weddingDate:'',venue:''})
const submitted = ref(false)
async function load(){
  const res = await fetch(`/api/rsvp/${route.params.token}`)
  if(res.ok) data.value = await res.json()
}
function formatDate(d){ if(!d) return '' ; return new Date(d).toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit',year:'numeric'}) }
async function respond(status){ const payload={name:'אורח',rsvpStatus:status}; await fetch(`/api/rsvp/${route.params.token}/respond`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); submitted.value=true }
onMounted(load)
</script>
<style scoped>
.rsvp-public{display:flex;align-items:center;justify-content:center;padding:var(--space-8)}
.card{background:var(--color-bg-card);padding:var(--space-6);border-radius:var(--radius-xl);max-width:560px;text-align:center}
.couple{font-size:var(--font-size-3xl);color:var(--color-navy);}
.date{color:var(--color-text-muted);margin-bottom:var(--space-4)}
.cta-row{display:flex;gap:var(--space-3);justify-content:center}
.thank{font-weight:800;color:var(--color-success)}
.btn-danger{background:var(--color-error);color:#fff}
</style>