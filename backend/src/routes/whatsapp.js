// TODO: implement whatsapp routes
export default async function whatsappRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'whatsapp routes - coming soon' }
  })
}
