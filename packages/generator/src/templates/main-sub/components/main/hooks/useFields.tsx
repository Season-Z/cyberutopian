import { syService } from '@/services';
import { useFormManagerProvider } from '@enhance/define-table';
import type { FieldListType } from '@enhance/define-table/dist/components/fom/types';
import { computed, ref } from 'vue';

const useFields = () => {
  const { formRef } = useFormManagerProvider();

  const code = ref<FieldListType['formType']>('input');

  const customFields = computed<FieldListType[]>(() => [
    {
      prop: 'code',
      formType: code.value,
      fieldProps(type) {
        console.log(type);
        return {};
      },
    },
    {
      prop: 'name',
      model(type) {
        console.log(type, 'name');
        return 'abc';
      },
      formType: (type) => {
        console.log(type, 'huge-select');
        return 'huge-select';
      },
      hugeSelectProps: (type) => {
        console.log('hugeSelectProps', type);
        return {
          remoteMethod: syService['postMainDataProcedureDefinitionGetOption'],
          echoParams: 'name',
        };
      },
    },
    {
      prop: 'enableInd',
      formType: 'radio',
      dataSource: [
        { label: '启用', value: 1 },
        { label: '不启用', value: 0 },
      ],
    },
  ]);

  return customFields;
};

export default useFields;
