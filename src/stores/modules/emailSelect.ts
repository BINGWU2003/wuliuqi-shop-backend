import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CodmEmail } from '@/api/codm-email'

const useEmailSelectStore = defineStore('emailSelect', () => {
  const selectedEmail = ref<string>('')
  const selectedEmailData = ref<CodmEmail | null>(null)

  const setSelectedEmail = (email: string, emailData?: CodmEmail) => {
    selectedEmail.value = email
    if (emailData) {
      selectedEmailData.value = emailData
    }
  }

  const clearSelectedEmail = () => {
    selectedEmail.value = ''
    selectedEmailData.value = null
  }

  return {
    selectedEmail,
    selectedEmailData,
    setSelectedEmail,
    clearSelectedEmail,
  }
})

export default useEmailSelectStore
