// TODO: implement gifts routes
export default async function giftsRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'gifts routes - coming soon' }
  })
}
