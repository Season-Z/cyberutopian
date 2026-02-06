<script lang="tsx" setup>
import { syService } from '@/services';
import { SupplierDefinition, 供应商列表查询 } from '@/services/types-供应链管理';
import { TableSearchDataType } from '@enhance/define-table/dist/typings';
import useColumns from './hooks/useColumns';
import useFields from './hooks/useFields';

const customFields = useFields();
const customColumns = useColumns();
</script>

<template>
  <define-table
    tableCode="DFS2023022200002_GENERAL_com.shuyilink.linkim.supply.admin.model.vo.SupplierDefinitionVO"
    tableName="tableName"
    :apis="{
      add: (data: SupplierDefinition) =>
        syService['postSupplySupplierDefinition']({
          data: data,
        }),
      edit: (data: SupplierDefinition) => syService['putSupplySupplierDefinition']({ data: data }),
      delete: (data: number[]) => syService['postSupplySupplierDefinitionBatchDelete']({ data }),
      search: async (data: TableSearchDataType<供应商列表查询>) => {
        return syService['postSupplySupplierDefinitionPage']({
          data,
        });
      },
      export: () => { },
      
    }"
    :hooks="{
      openDialog: (data: any) => {
        // 打开弹窗的回调。这里定义打开弹窗初始化数据；
        return data;
      },
    }"
    :table-props="{}"
    :customFields="customFields"
    :customColumn="customColumns"
  >
  </define-table>
</template>
