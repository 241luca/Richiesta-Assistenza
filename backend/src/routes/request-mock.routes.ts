import { Router } from 'express';

const router = Router();

// Mock data for requests
const mockRequests = [
  {
    id: '1',
    title: 'Sistema idraulico complesso',
    description: 'Necessaria riparazione completa del sistema idraulico del bagno principale. La tubatura presenta diverse perdite e necessita di una revisione completa.',
    Category: 'Idraulica',
    status: 'pending',
    priority: 'high',
    address: 'Via Roma 123',
    city: 'Milano',
    province: 'MI',
    postalCode: '20100',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientId: '1',
    Client: {
      id: '1',
      firstName: 'Mario',
      lastName: 'Rossi',
      fullName: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      phone: '333-1234567'
    },
    professionalId: null,
    professional: null,
    requestedDate: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Il cliente preferisce essere contattato al mattino',
    attachments: [],
    quotes: []
  },
  {
    id: '2',
    title: 'Installazione luci giardino',
    description: 'Installazione di un nuovo sistema di illuminazione per il giardino con luci LED a basso consumo.',
    Category: 'Elettricista',
    status: 'in_progress',
    priority: 'medium',
    address: 'Via Milano 45',
    city: 'Roma',
    province: 'RM',
    postalCode: '00100',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    clientId: '1',
    Client: {
      id: '1',
      firstName: 'Mario',
      lastName: 'Rossi',
      fullName: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      phone: '333-1234567'
    },
    professionalId: '2',
    professional: {
      id: '2',
      firstName: 'Luigi',
      lastName: 'Bianchi',
      fullName: 'Luigi Bianchi',
      profession: 'Elettricista'
    },
    requestedDate: new Date(Date.now() + 172800000).toISOString(),
    notes: '',
    attachments: [],
    quotes: [
      {
        id: '1',
        requestId: '2',
        professionalId: '2',
        title: 'Preventivo installazione luci',
        totalAmount: 800,
        status: 'accepted',
        createdAt: new Date(Date.now() - 43200000).toISOString()
      }
    ]
  }
];

// GET /api/requests - Get all requests
router.get('/', (req: any, res: any) => {
  // Filter based on user role if needed
  let filteredRequests = [...mockRequests];
  
  // Apply filters from query params
  if (req.query.status) {
    filteredRequests = filteredRequests.filter(r => r.status === req.query.status);
  }
  if (req.query.category) {
    filteredRequests = filteredRequests.filter(r => r.category === req.query.category);
  }
  
  res.json({ 
    requests: filteredRequests,
    total: filteredRequests.length 
  });
});

// GET /api/requests/:id - Get single request
router.get('/:id', (req: any, res: any) => {
  const request = mockRequests.find(r => r.id === req.params.id);
  
  if (!request) {
    return res.status(404).json({ 
      error: 'Request not found',
      message: `No request found with ID: ${req.params.id}`
    });
  }
  
  // Return the full request object with all details
  res.json(request);
});

// POST /api/requests - Create new request
router.post('/', (req: any, res: any) => {
  const newRequest = {
    id: String(mockRequests.length + 1),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientId: req.user?.id || '1',
    Client: {
      id: req.user?.id || '1',
      firstName: req.user?.firstName || 'Test',
      lastName: req.user?.lastName || 'User',
      fullName: req.user?.fullName || 'Test User',
      email: req.user?.email || 'test@example.com',
      phone: '333-0000000'
    },
    professionalId: null,
    professional: null,
    attachments: [],
    quotes: []
  };
  
  mockRequests.push(newRequest);
  res.status(201).json(newRequest);
});

// PUT /api/requests/:id - Update request
router.put('/:id', (req: any, res: any) => {
  const index = mockRequests.findIndex(r => r.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  mockRequests[index] = {
    ...mockRequests[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(mockRequests[index]);
});

// PATCH /api/requests/:id/status - Update status
router.patch('/:id/status', (req: any, res: any) => {
  const index = mockRequests.findIndex(r => r.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  mockRequests[index].status = req.body.status;
  mockRequests[index].updatedAt = new Date().toISOString();
  
  res.json(mockRequests[index]);
});

// GET /api/requests/:id/quotes - Get quotes for request
router.get('/:id/quotes', (req: any, res: any) => {
  const request = mockRequests.find(r => r.id === req.params.id);
  
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  res.json({ 
    quotes: request.quotes || [],
    total: request.quotes?.length || 0
  });
});

// GET /api/requests/:id/attachments - Get attachments
router.get('/:id/attachments', (req: any, res: any) => {
  const request = mockRequests.find(r => r.id === req.params.id);
  
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  res.json({ 
    attachments: request.attachments || [],
    total: request.attachments?.length || 0
  });
});

export default router;
