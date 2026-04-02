// TODO: implement vendors routes
export default async function vendorsRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'vendors routes - coming soon' }
  })
}
