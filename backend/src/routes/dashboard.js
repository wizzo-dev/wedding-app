// TODO: implement dashboard routes
export default async function dashboardRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'dashboard routes - coming soon' }
  })
}
