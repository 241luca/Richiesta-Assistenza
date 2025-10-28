import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Settings, Microscope, Database, Activity, FolderSync, HardDrive } from 'lucide-react';

export default function SmartDocsPage() {
  const navigate = useNavigate();

  const pages = [
    {
      title: 'Settings',
      description: 'Manage containers, categories, and system configuration',
      icon: Settings,
      path: '/admin/smartdocs/settings',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Test Lab',
      description: 'Advanced testing tools for sync, query, and knowledge graph',
      icon: Microscope,
      path: '/admin/smartdocs/test-lab',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Sync Settings',
      description: 'Configure automatic synchronization from external systems',
      icon: FolderSync,
      path: '/admin/smartdocs/sync-settings',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Storage Dashboard',
      description: 'Manage MinIO storage, buckets, and files',
      icon: HardDrive,
      path: '/admin/smartdocs/storage',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Sync Monitor',
      description: 'Monitor active synchronizations and review history',
      icon: Activity,
      path: '/admin/smartdocs/sync-monitor',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'System Status',
      description: 'View health status of all SmartDocs services',
      icon: Database,
      path: '/admin/smartdocs/system-status',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SmartDocs Management</h1>
        <p className="text-gray-600 mt-2">
          AI-powered document knowledge management system with RAG (Retrieval-Augmented Generation)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Card 
              key={page.path}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-gray-300"
              onClick={() => navigate(page.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${page.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${page.color}`} />
                </div>
                <CardTitle className="text-xl">{page.title}</CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(page.path);
                  }}
                >
                  Open →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Quick Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">What is SmartDocs?</h4>
              <p className="text-sm text-gray-700">
                SmartDocs is an AI-powered knowledge management system that uses semantic chunking, 
                vector embeddings, and knowledge graph extraction to make your documents searchable and queryable.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Key Features</h4>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                <li>Automatic document synchronization</li>
                <li>Semantic search with RAG</li>
                <li>Knowledge graph extraction</li>
                <li>Multi-container organization</li>
                <li>Advanced testing tools</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
