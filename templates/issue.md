::: open .readonly.{{ 2|dark }} \
- [](/pages/issues/{{ 0 }}-$$:: dayjs('{{ 0 }}').format('YYMMDD') $$.md "#")

[+$$: '{{ 1| }}' === '1' ? '#slice=0' : '' $$](/pages/issues/{{ 0 }}-$$:: dayjs('{{ 0 }}').format('YYMMDD') $$.md)

$$: '{{ 1| }}' === '1' ? '……' : '' $$
:::

---
