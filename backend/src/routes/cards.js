// TODO: implement cards routes
export default async function cardsRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'cards routes - coming soon' }
  })
}
