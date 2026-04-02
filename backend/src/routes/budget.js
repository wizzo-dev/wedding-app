// TODO: implement budget routes
export default async function budgetRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'budget routes - coming soon' }
  })
}
