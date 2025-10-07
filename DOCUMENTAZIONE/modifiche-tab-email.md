# 📝 SCRIPT PER AGGIUNGERE TAB EMAIL TEMPLATES

## Da aggiungere dopo la tab "Template" (circa riga 838):

```jsx
<button
  onClick={() => setActiveTab('email-templates')}
  className={`${
    activeTab === 'email-templates'
      ? 'border-indigo-500 text-indigo-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
>
  <EnvelopeIcon className="h-4 w-4 mr-2" />
  Email Brevo
</button>
```

## Da aggiungere nella sezione content dopo activeTab === 'templates' (circa riga 870):

```jsx
{activeTab === 'email-templates' && <BrevoTemplateManager />}
```
