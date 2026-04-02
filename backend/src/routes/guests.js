// TODO: implement guests routes
export default async function guestsRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'guests routes - coming soon' }
  })
}
