type AdminLoginPayload = {
  email: string
  senha: string
}

export const authService = {
  async loginAdmin(payload: AdminLoginPayload) {
    console.info('Login administrativo pronto para integracao com a API', payload)
  },
}
