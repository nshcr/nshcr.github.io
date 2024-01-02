# $$:: conf.siteName $$

@updated: 2023-12-04

:::
这里被我用来存放一些私人的、充斥个人趣味的碎碎念，不嫌弃的话可以闲逛一会儿。
: 或许你会想先看一下 [](/README.md "#")。
:::

---

[+#slice=$$: vno.mainSelf.query.page || 0 $$](/pages.md)

$$: parseInt(vno.mainSelf.query.page || '0') > 0 ? `<button class="btn bold warning" onclick="vno.path.changeQuery(vno.path.formatQuery({ page: parseInt(vno.mainSelf.query.page || '0') - 1 + ''}))">« 上一页</button>` : '' $$$$: parseInt(vno.mainSelf.query.page || '0') < 5 ? `<button class="btn bold warning" onclick="vno.path.changeQuery(vno.path.formatQuery({ page: parseInt(vno.mainSelf.query.page || '0') + 1 + ''}))">下一页 »</button>` : '' $$
