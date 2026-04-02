<template>
  <div class="settings-view" dir="rtl">
    <header class="page-header"><div><h1 class="page-title">⚙️ הגדרות</h1><p class="page-subtitle">פרטי החתונה שלכם</p></div></header>
    <div class="settings-tabs">
      <router-link to="/app/settings" class="tab-link" exact-active-class="active">👫 פרופיל</router-link>
      <router-link to="/app/settings/account" class="tab-link" active-class="active">🔒 חשבון</router-link>
      <router-link to="/app/settings/subscription" class="tab-link" active-class="active">💎 מנוי</router-link>
    </div>
    <div class="settings-card">
      <h2 class="card-title">פרטי החתונה</h2>
      <div v-if="saved" class="success-banner">✅ הפרטים נשמרו בהצלחה!</div>
      <div v-if="error" class="error-banner">⚠️ {{ error }}</div>
      <form @submit.prevent="save">
        <div class="form-row">
          <div class="form-group"><label>שם הכלה</label><input v-model="form.name1" type="text" class="form-input" /></div>
          <div class="form-group"><label>שם החתן</label><input v-model="form.name2" type="text" class="form-input" /></div>
        </div>
        <div class="form-group"><label>תאריך החתונה</label><input v-model="form.weddingDate" type="date" class="form-input" /></div>
        <div class="form-group"><label>שם האולם</label><input v-model="form.venue" type="text" class="form-input" placeholder="גן עדן אירועים" /></div>
        <div class="form-group"><label>כתובת האולם</label><input v-model="form.venueAddress" type="text" class="form-input" placeholder="רחוב, עיר" /></div>
        <div v-if="rsvpToken" class="rsvp-box">
          <label class="rsvp-label">🔗 לינק RSVP אישי</label>
          <div class="rsvp-row">
            <input :value="rsvpUrl" readonly class="rsvp-input" />
            <button type="button" @click="copyRsvp" class="btn btn-outline btn-sm">{{ copied?'✓ הועתק':'העתק' }}</button>
          </div>
        </div>
        <div class="form-actions"><button type="submit" class="btn btn-primary" :disabled="saving">{{ saving?'שומר...':' 💾 שמור שינויים' }}</button></div>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const form = ref({name1:'',name2:'',weddingDate:'',venue:'',venueAddress:''})
const rsvpToken = ref(''); const saving = ref(false); const saved = ref(false); const error = ref(null); const copied = ref(false)
const rsvpUrl = computed(() => rsvpToken.value?`${window.location.origin}/rsvp/${rsvpToken.value}`:'')
async function load() {
  try { const res=await fetch('/api/users/profile',{headers:{Authorization:`Bearer ${auth.token}`}}); const data=await res.json(); form.value={name1:data.name1||'',name2:data.name2||'',weddingDate:data.weddingDate?data.weddingDate.slice(0,10):'',venue:data.venue||'',venueAddress:data.venueAddress||''}; rsvpToken.value=data.rsvpToken||''} catch(e){error.value=e.message}
}
async function save() {
  saving.value=true; error.value=null; saved.value=false
  try { const res=await fetch('/api/users/profile',{method:'PUT',headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},body:JSON.stringify(form.value)}); if(!res.ok)throw new Error('שגיאה'); saved.value=true; setTimeout(()=>saved.value=false,3000) }
  catch(e){error.value=e.message} finally{saving.value=false}
}
function copyRsvp() { navigator.clipboard.writeText(rsvpUrl.value); copied.value=true; setTimeout(()=>copied.value=false,2000) }
onMounted(load)
</script>
<style scoped>
.settings-view{max-width:700px;margin:0 auto;padding:var(--space-6);}
.page-header{margin-bottom:var(--space-5);}
.page-title{font-size:var(--font-size-2xl);font-weight:800;color:var(--color-navy);margin:0 0 4px;}
.page-subtitle{color:var(--color-text-muted);font-size:var(--font-size-sm);margin:0;}
.settings-tabs{display:flex;gap:var(--space-2);border-bottom:2px solid var(--color-border);margin-bottom:var(--space-6);}
.tab-link{display:block;padding:var(--space-3) var(--space-4);font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-muted);text-decoration:none;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all var(--transition-fast);}
.tab-link:hover{color:var(--color-navy);}
.tab-link.active{color:var(--color-primary);border-bottom-color:var(--color-primary);}
.settings-card{background:var(--color-bg-card);border-radius:var(--radius-xl);padding:var(--space-6);box-shadow:var(--shadow-sm);}
.card-title{font-size:var(--font-size-lg);font-weight:800;color:var(--color-navy);margin:0 0 var(--space-5);}
.success-banner{background:var(--color-success-bg);color:#065f46;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);margin-bottom:var(--space-4);font-weight:600;font-size:var(--font-size-sm);}
.error-banner{background:var(--color-error-bg);color:#991b1b;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);margin-bottom:var(--space-4);font-size:var(--font-size-sm);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);}
.form-group{margin-bottom:var(--space-4);}
.form-group label{display:block;font-size:var(--font-size-xs);font-weight:700;color:var(--color-text-muted);margin-bottom:6px;}
.form-input{width:100%;padding:var(--space-3) var(--space-4);border:1.5px solid var(--color-border);border-radius:var(--radius-lg);font-family:var(--font);font-size:var(--font-size-sm);color:var(--color-navy);background:var(--color-bg-card);}
.form-input:focus{outline:none;border-color:var(--color-primary);}
.rsvp-box{background:var(--color-primary-bg);border-radius:var(--radius-lg);padding:var(--space-4);margin-bottom:var(--space-5);}
.rsvp-label{display:block;font-size:var(--font-size-xs);font-weight:700;color:var(--color-primary);margin-bottom:var(--space-2);}
.rsvp-row{display:flex;gap:var(--space-2);}
.rsvp-input{flex:1;padding:var(--space-2) var(--space-3);border:1.5px solid var(--color-primary);border-radius:var(--radius-lg);font-family:var(--font);font-size:var(--font-size-xs);background:#fff;color:var(--color-navy);}
.form-actions{display:flex;justify-content:flex-end;}
.btn{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-5);border-radius:var(--radius-lg);font-family:var(--font);font-size:var(--font-size-sm);font-weight:600;cursor:pointer;border:none;text-decoration:none;transition:all var(--transition);}
.btn-sm{padding:var(--space-1) var(--space-3);font-size:var(--font-size-xs);}
.btn-primary{background:var(--color-primary);color:#fff;}
.btn-primary:hover{filter:brightness(1.08);}
.btn-primary:disabled{opacity:.6;cursor:not-allowed;}
.btn-outline{background:transparent;border:1.5px solid var(--color-primary);color:var(--color-primary);}
.btn-outline:hover{background:var(--color-primary-bg);}
@media(max-width:560px){.settings-view{padding:var(--space-4);}.form-row{grid-template-columns:1fr;}}
</style>