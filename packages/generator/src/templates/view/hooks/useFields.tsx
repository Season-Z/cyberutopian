import { useFormManagerProvider } from '@enhance/define-table';
import type { FieldListType } from '@enhance/define-table/dist/components/fom/types';
import { computed, ref } from 'vue';

const useFields = () => {
  // 在这里定义useFormManagerProvider也可以
  const { formRef } = useFormManagerProvider();

  // const procedure = useSyService['postMainDataProcedureDefinitionPage']({ data: { page: 1, size: 10 } });
  // procedure.data：接口返回的数据，响应式结构
  // procedure.loading：接口请求是否正在加载
  // procedure.sendRequest：请求函数，接收当前接口的入参
  // procedure.cancel：取消当前请求

  // const proce = computed(() => {
  // return procedure.data?.value?.records?.map((it) => ({ label: it.name, value: it.code })) || [];
  // });

  const code = ref<FieldListType['formType']>('input');

  const customFields = computed<FieldListType[]>(() => [
    {
      prop: 'code',
      formType: code.value,
      // model: 'bbb', // 设置了model，则提交字段为model的值
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
