<template>
  <div class="settings-view" dir="rtl">
    <header class="page-header"><div><h1 class="page-title">⚙️ הגדרות</h1><p class="page-subtitle">ניהול חשבון</p></div></header>
    <div class="settings-tabs">
      <router-link to="/app/settings" class="tab-link" exact-active-class="active">👫 פרופיל</router-link>
      <router-link to="/app/settings/account" class="tab-link active">🔒 חשבון</router-link>
      <router-link to="/app/settings/subscription" class="tab-link" active-class="active">💎 מנוי</router-link>
    </div>
    <div class="settings-card">
      <h2 class="card-title">✉️ שינוי אימייל</h2>
      <div v-if="emailMsg" class="success-banner">{{ emailMsg }}</div>
      <div v-if="emailError" class="error-banner">{{ emailError }}</div>
      <form @submit.prevent="changeEmail">
        <div class="form-group"><label>אימייל נוכחי</label><input :value="currentEmail" disabled class="form-input" /></div>
        <div class="form-group"><label>אימייל חדש</label><input v-model="emailForm.email" type="email" class="form-input" required /></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary" :disabled="emailSaving">{{ emailSaving?'שומר...':'עדכן אימייל' }}</button></div>
      </form>
    </div>
    <div class="settings-card" style="margin-top:var(--space-5)">
      <h2 class="card-title">🔒 שינוי סיסמה</h2>
      <div v-if="pwMsg" class="success-banner">{{ pwMsg }}</div>
      <div v-if="pwError" class="error-banner">{{ pwError }}</div>
      <form @submit.prevent="changePassword">
        <div class="form-group"><label>סיסמה נוכחית</label><input v-model="pwForm.current" type="password" class="form-input" required /></div>
        <div class="form-group"><label>סיסמה חדשה</label><input v-model="pwForm.new" type="password" class="form-input" minlength="8" required /></div>
        <div class="form-group"><label>אשר סיסמה חדשה</label><input v-model="pwForm.confirm" type="password" class="form-input" required /></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary" :disabled="pwSaving">{{ pwSaving?'שומר...':'שנה סיסמה' }}</button></div>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const currentEmail=ref(''); const emailForm=ref({email:''}); const pwForm=ref({current:'',new:'',confirm:''})
const emailSaving=ref(false); const pwSaving=ref(false); const emailMsg=ref(null); const emailError=ref(null); const pwMsg=ref(null); const pwError=ref(null)
async function load() { try { const res=await fetch('/api/users/profile',{headers:{Authorization:`Bearer ${auth.token}`}}); const data=await res.json(); currentEmail.value=data.email||''} catch {} }
async function changeEmail() {
  emailSaving.value=true; emailMsg.value=null; emailError.value=null
  try { const res=await fetch('/api/users/account',{method:'PUT',headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},body:JSON.stringify({email:emailForm.value.email})}); const data=await res.json(); if(!res.ok)throw new Error(data.error||'שגיאה'); currentEmail.value=emailForm.value.email; emailForm.value.email=''; emailMsg.value='✅ האימייל עודכן!' }
  catch(e){emailError.value=e.message} finally{emailSaving.value=false}
}
async function changePassword() {
  if(pwForm.value.new!==pwForm.value.confirm){pwError.value='הסיסמאות לא תואמות';return}
  pwSaving.value=true; pwMsg.value=null; pwError.value=null
  try { const res=await fetch('/api/users/account',{method:'PUT',headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},body:JSON.stringify({currentPassword:pwForm.value.current,newPassword:pwForm.value.new})}); const data=await res.json(); if(!res.ok)throw new Error(data.error||'שגיאה'); pwForm.value={current:'',new:'',confirm:''}; pwMsg.value='✅ הסיסמה שונתה!' }
  catch(e){pwError.value=e.message} finally{pwSaving.value=false}
}
onMounted(load)
</script>
<style scoped>
.settings-view{max-width:700px;margin:0 auto;padding:var(--space-6);}
.page-header{margin-bottom:var(--space-5);}
.page-title{font-size:var(--font-size-2xl);font-weight:800;color:var(--color-navy);margin:0 0 4px;}
.page-subtitle{color:var(--color-text-muted);font-size:var(--font-size-sm);margin:0;}
.settings-tabs{display:flex;gap:var(--space-2);border-bottom:2px solid var(--color-border);margin-bottom:var(--space-6);}
.tab-link{display:block;padding:var(--space-3) var(--space-4);font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-muted);text-decoration:none;border-bottom:2px solid transparent;margin-bottom:-2px;}
.tab-link:hover{color:var(--color-navy);}
.tab-link.active{color:var(--color-primary);border-bottom-color:var(--color-primary);}
.settings-card{background:var(--color-bg-card);border-radius:var(--radius-xl);padding:var(--space-6);box-shadow:var(--shadow-sm);}
.card-title{font-size:var(--font-size-lg);font-weight:800;color:var(--color-navy);margin:0 0 var(--space-5);}
.success-banner{background:var(--color-success-bg);color:#065f46;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);margin-bottom:var(--space-4);font-weight:600;font-size:var(--font-size-sm);}
.error-banner{background:var(--color-error-bg);color:#991b1b;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);margin-bottom:var(--space-4);font-size:var(--font-size-sm);}
.form-group{margin-bottom:var(--space-4);}
.form-group label{display:block;font-size:var(--font-size-xs);font-weight:700;color:var(--color-text-muted);margin-bottom:6px;}
.form-input{width:100%;padding:var(--space-3) var(--space-4);border:1.5px solid var(--color-border);border-radius:var(--radius-lg);font-family:var(--font);font-size:var(--font-size-sm);color:var(--color-navy);background:var(--color-bg-card);}
.form-input:disabled{background:var(--color-bg-subtle);color:var(--color-text-muted);}
.form-actions{display:flex;justify-content:flex-end;}
.btn{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-5);border-radius:var(--radius-lg);font-family:var(--font);font-size:var(--font-size-sm);font-weight:600;cursor:pointer;border:none;transition:all var(--transition);}
.btn-primary{background:var(--color-primary);color:#fff;}
.btn-primary:hover{filter:brightness(1.08);}
.btn-primary:disabled{opacity:.6;cursor:not-allowed;}
</style>