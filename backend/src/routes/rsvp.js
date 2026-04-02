// TODO: implement rsvp routes
export default async function rsvpRoutes(app) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    return { message: 'rsvp routes - coming soon' }
  })
}
