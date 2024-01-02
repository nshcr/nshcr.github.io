# Godot 3.0 中的 Autotiling

@tags: Godot, 翻译
@updated: 2020-05-24

: 我翻译时的 Godot 版本为 3.2.1，这篇文章的实操部分已经不再适用，不过理论部分还是很好地解释了 Godot 中 Autotiling 逻辑。

> 本文译自：[Autotiling in Godot 3.0](https://michagamedev.wordpress.com/2018/02/24/181/)

[slice]

[toc]

免责声明 1：我不是 Autotiling 功能的作者，也没有足够的经验理解它的源码。在写这篇教程时，我基本上只是在玩这个功能，直到我有足够的信心向其他人解释它，所以它可能仍然存在一些错误。如果你发现了，请告诉我！

免责声明 2：我正在描述的是 Godot 3.0 中的 Autotiling 功能。它在当前还是个有些粗糙的框架，我期待未来的改动。

我首先会解释 Godot 的 Autotiling 算法是如何决定哪些 Tile 该放在哪里。然后是如何规划、设置和绘制一个新的 Tileset。最后，我将展示怎样在 Godot 中使用 Autotiling。

## Autotiling 背后的逻辑

我们只需要考虑两种类型的 Tileset：背景和前景。在俯视角游戏中，它们可以是水（背景）和陆地 / 岛屿（前景）。在平台游戏中，它们可以是空气 / 空无一物（背景）和坚固的墙壁（前景）。我们可以通过点击编辑器来放置前景 Tile，然后右击移除它们并放上背景。在这里我们将把前景 Tile 视作“活动”，背景 Tile 视为“非活动”。

所以通过点击编辑器，我们可以得到一个由活动和非活动单元格组成的网格，就像下面这样（灰色 = 活动，白色 = 非活动）：

![](/uploads/images/pages/autotiling-in-godot-3-image1.png)

每个单元格除了有活动 / 非活动信息外，还包含了每个边和角的信息。和单元格类似，这些边和角也有活动和非活动两种状态。不过，我们并不能在编辑器中直接切换它们的状态。它们的行为是由以下逻辑定义的：

- 如果相邻的两个单元格都处于活动状态，则边处于活动状态。
- 如果相邻的四个单元格都处于活动状态，则角处于活动状态。

（注意： 这个逻辑特定于 Godot 的当前实现。你也可以想象一个允许直接编辑边和角的编辑器。）

对于上面的示例网格，我们可以得到以下边和角的数据（绿色 = 活动，白色 = 非活动）：

![](/uploads/images/pages/autotiling-in-godot-3-image2.png)

接下来，算法要为每个单元确定 Bitmask。目前在 Godot 中，有两种 Bitmask 可用： 2 x 2 和 3 x 3。2 x 2 Bitmask 由单元格的四个角组成，3 x 3 Bitmask 由四个角、四个边和单元格自身组成。在 Godot 中，Bitmask 表示为由红色（活动）或透明（非活动）矩形组成的小（2 x 2 或 3 x 3）网格。下面两张图展示了这两种 Bitmask。

2 x 2：

![](/uploads/images/pages/autotiling-in-godot-3-image3.png)

3 x 3：

![](/uploads/images/pages/autotiling-in-godot-3-image4.png)

现在差不多要说完了。Godot 中的 Autotiling 模块包含一组 Tile 以及每个 Tile 的 Bitmask。为了找到网格里单元格的正确 Tile，算法会遍历所有 Tile 并尝试找出具有相匹配 Bitmask 的 Tile。如果结果有多个，则随机选取一个。如果没有找到，则选择默认的。

## 规划和绘制一个 Tileset

如果每个可能的 Bitmask 都至少有一个 Tile，那么 Autotiling 的效果最好。否则算法可能会让某些地方回退到默认 Tile，导致 Tile 无法完美匹配。因此在绘制一个 Tileset 之前，列出所有可能的 Bitmask 是很有意义的。

在 2 x 2 的情况下，非常直接：Bitmask 由 4 位组成，所以我们总共可以得到 2 ^ 4 = 16 种 Bitmask。我们可以很好的像这样把它们放置在一个小网格中：

![](/uploads/images/pages/autotiling-in-godot-3-image5.png)

顺序准不准确并不重要，我是从这个很棒的 [介绍 Tile 的网站](http://www.cr31.co.uk/stagecast/wang/tiles_c.html) 上复制的排列。

然后打开你最喜欢的画图软件，使用上面这张图作为模板，将它缩放到正确的大小，放入背景中，再在上面绘制 Tile。下面这张图示范了这类 Tileset 应该是什么样子：

![](/uploads/images/pages/autotiling-in-godot-3-tileset2x2.png)

在 3 x 3 的情况下，一切都变得复杂。我们有了 9 位，理论上需要 2 ^ 9 = 512 个一组的 Tile。幸运的是，我们不必把所有 Bitmask 都绘制出来。如果我们遵循上面解释的单元格 + 边 + 角逻辑的话，并不是所有 Bitmask 都是合理的。实际上，我们可以使用以下规则简化：

- 中心位（单元格位）始终处于活动状态。如果它处于非活动状态，Tile 不会被绘制。
- 只有当两个相邻的边处于活动状态时，角才能处于活动状态。

利用这两种简化规则，有意义的 Tile 数量减少到了 47 个。我们再把纯背景作为第 48 个 Tile。最终可以得到以下 Bitmask 集合：

![](/uploads/images/pages/autotiling-in-godot-3-image6.png)

这个排列也不是我的发明，再次来自这个 [网站](http://www.cr31.co.uk/stagecast/wang/blob.html)。你可以打开它查看这个排列的示例 Tileset。

## 在 Godot 3.0 中使用 Autotiling（略）

（这部分操作在新版 Godot 中变动较多，这里就不翻译了）

## 总结

感谢阅读，我希望这个教程对你有些帮助。如果你有任何问题或建议，请（到原文）留下评论。

在这个教程中，我没有涉及如何在 Autotiling 模块里设置碰撞、遮挡和导航。我自己还没有尝试过，但我相信这些内容也会是相当直接的。
