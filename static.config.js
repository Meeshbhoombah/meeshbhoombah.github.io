import { reloadRoutes } from 'react-static/node'
import jdown from 'jdown'
import chokidar from 'chokidar'

chokidar.watch('projects').on('all', () => reloadRoutes())

export default {
    getSiteData: () => ({
        title: 'Rohan (@Meeshbhoombah) Mishra',
        lastBuilt: Date.now()
    }),  
    getRoutes: async () => {
        const projects = await jdown('projects')
        return [{
            path: '/',
            component: 'src/views/Home'
        }]
    }
}
