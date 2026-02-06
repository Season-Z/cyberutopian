import type { ProcedureDefinition } from '@/services/types-主数据管理';
import type { WrapperTablePropsType } from '@enhance/define-table/dist/typings';
import { computed } from 'vue';

const useColumns = () => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
  };

  const customColumn = computed<WrapperTablePropsType<ProcedureDefinition>['customColumn']>(() => [
    {
      prop: 'name', // 改成你的字段名
      label: '名称', // 显示在表格上的标题
      align: 'center', // 对齐方式
      width: 200,
      formatter: (data): any => {
        return <el-button onClick={handleClick}>hhhhhh</el-button>; // 可以自定义
      },
    },
  ]);

  return customColumn;
};

export default useColumns;
