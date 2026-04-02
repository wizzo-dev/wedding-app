// TODO: implement seating routes
export default async function seatingRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'seating routes - coming soon' }
  })
}
