import { CustomFormManager } from '../../components/custom-forms/CustomFormManager';
import { useAuth } from '../../hooks/useAuth';

export const ProfessionalCustomFormsPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <CustomFormManager 
        showCreateButton={true}
        showActions={true}
      />
    </div>
  );
};
