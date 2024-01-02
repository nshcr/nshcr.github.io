# 为 Python-Markdown 模块编写扩展

@tags: Python, 翻译
@updated: 2018-03-26

: 2021/3/5：重新校对了一遍。

> 本文译自：[Tutorial 1 Writing Extensions for Python Markdown](https://github.com/Python-Markdown/markdown/wiki/Tutorial-1---Writing-Extensions-for-Python-Markdown)

[slice]

[toc]

## 介绍

Python-Markdown 除了有若干内建扩展，也提供 API 允许任何人编写他们自己的扩展来修改已有的行为，或是添加新行为。[API 文档](https://python-markdown.github.io/extensions/api/) 可能对初上手的人来说有些庞大，不过接下来的教程会带你一步步实现一个简单扩展，然后给它添加更多的特性。为了演示说明 API 的各个部分，有些步骤会以不同的方式重复。

首先我们要确定将要实现的语法。与其重新实现那些已有的 Markdown 语法，不如创造一些有别于典型 Markdown 的不同语法。事实上，我们会用 [txt2tags](http://mostlylinux.wordpress.com/textanddocument/txt2tagscheatsheet/#inlinebold) 标记语言实现一组内联语法的子集。这种语法看上去就像这样：

- 两个连字符包围表示删除：`--del--` => `<del>del</del>` => ~~del~~
- 两个下划线包围表示插入：`__ins__` => `<ins>ins</ins>` => <ins>ins</ins>
- 两个星号包围表示粗体：`**strong**` => `<strong>strong</strong>` => **strong**
- 两个斜杠包围表示斜体：`//emphasis//` => `<em>emphasis</em>` => *emphasis*

## 样板代码

任何 Python-Markdown 扩展都需要先创建样板代码。

**警告**：这个教程非常的宽泛，并没有假定你的开发环境。要是你的用户权限不正确，以下一些命令可能会在一些（不是所有）系统上产生错误。为了避免这类问题，建议使用 [virtualenv](http://virtualenv.readthedocs.org/en/latest/) 在一个隔离主系统的环境下开发，尽管这并不是必要的。配置一个恰当的开发环境来应对 Python 开发超出了这篇教程的范畴（开发 Markdown 扩展不需要添加额外包）。这里只是期望读者能对 Python 开发有个基础认识。

首先我们创建一个新目录来存放扩展文件。在命令行执行以下命令：

```shell
mkdir myextension
cd myextension
```

确保所有文件都位于刚创建的 `myextension` 目录中。注意这里我们把扩展命名为 `myextension`，你可能会想用不同的名字，不过要保证自始自终使用的都是同一个。

创建第一个 Python 文件，命名为 `myextension.py`，并且添加以下样板代码：

```python
from markdown.extensions import Extension

class MyExtension(Extension):
   def extendMarkdown(self, md):
       # 在这里插入代码来改变 Markdown 的行为
       pass
```

保存好后创建第二个 Python 文件，命名为 `setup.py`，添加以下代码：

```python
from setuptools import setup
setup(
    name='myextension',
    version='1.0',
    py_modules=['myextension'],
    install_requires = ['markdown>=3.0'],
)
```

最后，在命令行运行以下命令让 Python 使用新扩展：

```shell
python setup.py develop
```

注意这里运行的是 `develop` 子命令而不是 `install`。作为一个插件它还没有完成，这个特殊的开发模式会建立起路径来从源文件运行插件，而不是从 Python 的 `site-packages` 目录。通过使用这个方法，任何对文件的改动都会立即生效，也不需要重新安装扩展。

同样要注意的是，setup 脚本需要安装有 [setuptools](https://pypi.python.org/pypi/setuptools)。不过 setuptools 也不是必须的（可以用 `from distutils.core import setup` 替代），我们使用 setuptools 只是为了 `develop` 子命令。任何装有 [pip](http://www.pip-installer.org/) 或 [virtualenv](http://virtualenv.readthedocs.org/en/latest/)（都推荐使用）的系统都已经安装好了 setuptools。

为了确保所有东西都正常工作，先试着在 Markdown 中跑下扩展。打开 Python 解释器运行以下代码：

```python
>>> import markdown
>>> from myextension import MyExtension
>>> markdown.markdown('foo bar', extensions=[MyExtension()])
'<p>foo bar</p>'
```

很显然，这个扩展什么有用的事情都没做，不过好在也没出现错误，现在我们可以真正开始实现新语法了。

## 使用泛型模式

首先我们来实现不与 Markdown 标准语法重叠的一部分语法，`--del--` 语法会把文本用 `<del>` 标签包围起来。

第一步是写一个正则表达式来匹配 del 语法：

```python
DEL_RE = r'(--)(.*?)--'
```

注意这里第一组连字符（`(--)`）用小括号进行了分组。这是因为我们要使用的是 Python-Markdown 提供的泛型模式类。具体来说，`SimpleTextPattern` 期望文本内容可以在正则表达式的 `group(3)` 里找到。整个文本（包含标记）会作为 `group(1)`，所以我们要添加一个额外的组来强制使我们想要的内容位于 `group(3)`

另外要注意的是，内容要使用非贪婪模式 `(.*?)` 进行匹配。如果不这样的话，在第一个和最后一个 `--` 之间的所有东西都会被放进一个 `<del>` 标签，这不是我们想要的。

接着我们把正则表达式合并进 Markdown：

```python
from markdown.extensions import Extension
from markdown.inlinepatterns import SimpleTagPattern

DEL_RE = r'(--)(.*?)--'

class MyExtension(Extension):
    def extendMarkdown(self, md):
        # 创建 del 模式
        del_tag = SimpleTagPattern(DEL_RE, 'del')
        # 把 del 插入 Markdown 解析器
        md.inlinePatterns.add('del', del_tag, '>not_strong')
```

你应该注意到我们添加了两行。第一行创建了一个 `markdown.inlinepatterns.SimpleTagPattern` 实例，这个泛型模式类接受两个参数，一个是针对匹配的正则表达式（在这个例子中是 `DEL_RE`），另一个是要插入 `group(3)` 文本的标签名（`'del'`）。

第二行把新模式加进 Markdown 解析器。在这个例子中不太明显，任何 `markdown.Extension` 类的 `extendMarkdown` 方法都会传入 `md` 参数，它是我们要修改的 Markdown 类的实例。这个例子中，我们插入了一个新的内联模式叫做 `del`，模式实例 `del_tag` 会在 `not_strong` 模式之后使用（所以是 `>not_strong`）。

这次我们使用的 `add` 方法已经被废弃了。在未来的版本中，你首先需要在 [inline_patterns.py 的 build_inlinepatterns() 方法](https://github.com/Python-Markdown/markdown/blob/master/markdown/inlinepatterns.py#L73) 中找到实际的优先级，选择 75 作为 "not_strong" 的前一位，然后使用 `md.inlinePatterns.register(del_tag, 'del', 75)`。

现在来测试一下新扩展。打开 Python 解释器运行以下代码：

```python
>>> import markdown
>>> from myextension import MyExtension
>>> markdown.markdown('foo --deleted-- bar', extensions=[MyExtension()])
'<p>foo <del>deleted</del> bar</p>'
```

注意这里从 `myextension` 模块中导入了 `MyExtension` 类。然后我们把这个类的一个实例传给了 `markdown.markdown` 的 `extensions` 关键字。我们还可以看到返回的 HTML，它在浏览器里显示出来就像这样：

> foo ~~deleted~~ bar

让我们继续添加 `__ins__` 语法，它会使用 `<ins>` 标签：

```python
DEL_RE = r'(--)(.*?)--'
INS_RE = r'(__)(.*?)__'

class MyExtension(Extension):
    def extendMarkdown(self, md):
        del_tag = SimpleTagPattern(DEL_RE, 'del')
        md.inlinePatterns.add('del', del_tag, '>not_strong')
        ins_tag = SimpleTagPattern(INS_RE, 'ins')
        md.inlinePatterns.add('ins', ins_tag, '>del')
```

这段代码应该不用多说了。我们只是创建了一个新的 `'ins'` 模式，并把它加在了 `'del'` 模式之后。

`'ins'` 模式到这里就完成了，除了一个问题，我们现在给被双下划线包围的文本定义有两个可能的结果。想起来 Markdown 里还有个粗体语法（`__bold__`）定义在解析器里。不过因为新的插入语法会在粗体模式之前插入 `inlinePatterns`，插入模式会首先运行并消耗掉双下划线标记，不让粗体模式有机会找到它。即使如此，已经存在的粗体模式仍然会针对文本运行，还会白白拖慢解析器速度。因此，有个好做法是移除掉那些不再需要的部分。

不过因为我们还要定义属于自己的新粗体语法，这里其实可以用新模式来重写或替换旧模式。同样也适用于斜体模式。

首先，我们需要定义新的正则表达式。可以对之前的表达式做一点点修改：

```python
STRONG_RE = r'(\*\*)(.*?)\*\*'
EMPH_RE = r'(\/\/)(.*?)\/\/'
```

现在我们要把它们插进 Markdown 解析器。不过与插入和删除不同，我们需要重写现有的内联模式。Markdown 的粗体和斜体语法目前由两个内联模式实现：`'em_strong'`（解析星号）和 `'em_strong2'`（解析下划线）。

首先重写 `'em_strong'`：

```python
class MyExtension(Extension):
    def extendMarkdown(self, md):
        ...
        # 创建新的粗体模式
        strong_tag = SimpleTagPattern(STRONG_RE, 'strong')
        # 重写已有的粗体模式
        md.inlinePatterns['em_strong'] = strong_tag
```

注意，我们并没有添加一个新模式到现有模式的前后，只是简单地重新分配了 `'em_strong'` 模式的值。这是因为我们不需要改变已有 `'strong'` 模式在解析器中的位置，只要给它指定一个新的模式实例就可以了。不过它和 `add()` 方法一样被废弃了，你之后可能需要使用 `md.inlinePatterns.register(strong_tag, 'em_strong', 60)`。

`'emphasis'` 也可以这样指定，它会得到一个非常低的默认优先级：

```python
class MyExtension(Extension):
    def extendMarkdown(self, md):
        ...
        emph_tag = SimpleTagPattern(EMPH_RE, 'em')
        md.inlinePatterns['emphasis'] = emph_tag
```

现在还剩下一个旧的 `'em_strong2'` 模式。这个模式只是处理下划线，包括 `under_scored_words` 会被误认为斜体的特殊情况。由于新语法使用的是双斜杠，这里不再需要它了，我们可以直接删去。在 Markdown 语法中，由于粗体和斜体使用相同的字符，我们本来还需要处理一下两者互相嵌套的特殊情况（比如 `___like this___` 或 `___like_this__`）。在新语法中它们同样没有必要了，我们可以通过注销的方式删除它：

```python
class MyExtension(markdown.Extension):
    def extendMarkdown(self, md):
        ...
        md.inlinePatterns.deregister('em_strong2')
```

到这里所有新语法都实现完了。为完整起见，整个扩展就像这样：

```python
from markdown.extensions import Extension
from markdown.inlinepatterns import SimpleTagPattern

DEL_RE = r'(--)(.*?)--'
INS_RE = r'(__)(.*?)__'
STRONG_RE = r'(\*\*)(.*?)\*\*'
EMPH_RE = r'(\/\/)(.*?)\/\/'

class MyExtension(Extension):
    def extendMarkdown(self, md):
        del_tag = SimpleTagPattern(DEL_RE, 'del')
        md.inlinePatterns.add('del', del_tag, '>not_strong')
        ins_tag = SimpleTagPattern(INS_RE, 'ins')
        md.inlinePatterns.add('ins', ins_tag, '>del')
        strong_tag = SimpleTagPattern(STRONG_RE, 'strong')
        md.inlinePatterns['em_strong'] = strong_tag
        emph_tag = SimpleTagPattern(EMPH_RE, 'em')
        md.inlinePatterns['emphasis'] = emph_tag
        md.inlinePatterns.deregister('em_strong2')
```

为了确保它能正常工作，在 Python 解释器中运行以下代码：

```python
>>> import markdown
>>> from myextension import MyExtension
>>> txt = """
... Some __underline__
... Some --strike--
... Some **bold**
... Some //italics//
... """
...
>>> markdown.markdown(txt, extensions=[MyExtension()])
"<p>Some <ins>underline</ins>\nSome <del>strike</del>\nSome <strong>bold</strong>\nSome <em>italics</em>"
```

## 创建你自己的模式类

你可能注意到了上面的代码有很多重复。其实这四个新正则表达式可以很容易地压缩到一个里面去，只有一个模式运行起来也比有四个性能更佳。

让我们把这四个正则表达式重构进一个新的表达式：

```python
MULTI_RE = r'([*/_-]{2})(.*?)\2'
```

因为还没有能使用这个正则表达式的泛型模式类存在，所以我们要自己定义一个类。所有模式类都应该继承自 `markdown.inlinpatterns.Pattern` 基类。最起码子类要定义有 `handleMatch` 方法来接收一个正则表达式 [`MatchObject`](https://docs.python.org/2/library/re.html#match-objects) 并返回一个 ElementTree [`Element`](https://docs.python.org/2/library/xml.etree.elementtree.html#xml.etree.ElementTree.Element)。

```python
from markdown.inlinepatterns import Pattern
from markdown.extensions import Extension
import xml.etree.ElementTree as etree

class MultiPattern(Pattern):
    def handleMatch(self, m):
        if m.group(2) == '**':
            # 粗体
            tag = 'strong'
        elif m.group(2) == '//':
            # 斜体
            tag = 'em'
        elif m.group(2) == '__':
            # 下划线
            tag = 'ins'
        else:   # m.group(2) == '--':
            # 删除线
            tag = 'del'
        # 创建一个元素
        el = etree.Element(tag)
        el.text = m.group(3)
        return el
```

现在我们要让 Markdown 使用这个新模式并删除掉已经没用的模式：

```python
class MultiExtension(Extension):
    def extendMarkdown(self, md):
        # 删除旧模式
        md.inlinePatterns.deregister('em_strong')
        md.inlinePatterns.deregister('em_strong2')
        md.inlinePatterns.deregister('not_strong')

        # 添加新的 MultiPattern
        multi = MultiPattern(MULTI_RE)
        md.inlinePatterns['multi'] = multi
```

为了完整起见，最新添加的代码就像这样：

```python
from markdown.inlinepatterns import Pattern
from markdown.extensions import Extension
import xml.etree.ElementTree as etree

class MultiPattern(Pattern):
    def handleMatch(self, m):
        if m.group(2) == '**':
            # 粗体
            tag = 'strong'
        elif m.group(2) == '//':
            # 斜体
            tag = 'em'
        elif m.group(2) == '__':
            # 下划线
            tag = 'ins'
        else:   # m.group(2) == '--':
            # 删除线
            tag = 'del'
        # 创建一个元素
        el = etree.Element(tag)
        el.text = m.group(3)
        return el

class MultiExtension(Extension):
    def extendMarkdown(self, md):
        # 删除旧模式
        md.inlinePatterns.deregister('em_strong')
        md.inlinePatterns.deregister('em_strong2')
        md.inlinePatterns.deregister('not_strong')

        # 添加新的 MultiPattern
        multi = MultiPattern(MULTI_RE)
        md.inlinePatterns['multi'] = multi
```

在把这些代码添加到 `myextension.py` 文件后，打开 Python 解释器：

```python
>>> import markdown
>>> from myextension import MultiExtension
>>> txt = """
... Some __underline__
... Some --strike--
... Some **bold**
... Some //italics//
... """
...
>>> markdown.markdown(txt, extensions=[MultiExtension()])
"<p>Some <ins>underline</ins>\nSome <del>strike</del>\nSome <strong>bold</strong>\nSome <em>italics</em>"
```

## 添加配置选项

假设现在要给扩展提供一些配置选项，我们或许只是想把插入和删除语法作为一个选项提供，让用户可以打开或关闭它。

首先把我们的正则表达式拆成两部分：

```python
STRONG_EM_RE = r'([*/]{2})(.*?)\2'
INS_DEL_RE = r'([_-]{2})(.*?)\2'
```

然后，我们要在新的 `Extension` 子类上定义配置选项：

```python
class ConfigExtension(Extension):
    def __init__(self, **kwargs):
        # 定义配置选项和默认值
        self.config = {
            'ins_del': [False, 'Enable Insert and Delete syntax.']
        }
        # 调用父类 __init__ 方法来设置选项
        super().__init__(**kwargs)
```

我们先把配置选项定义为一个字典，它的键是每个选项的名字，值是一个包含默认值和描述的列表。我们使用列表而不是元组，这是因为 `Extension` 类要求 `config` 是可变的。

最后，重构 `extendMarkdown` 方法来应用配置选项：

```python
def extendMarkdown(self, md):
    ...
    # 添加 STRONG_EM 模式
    strong_em = MultiPattern(STRONG_EM_RE)
    md.inlinePatterns['strong_em'] = strong_em
    # 如果激活了就添加 INS_DEL 模式
    if self.getConfig('ins_del'):
        ins_del = MultiPattern(INS_DEL_RE)
        md.inlinePatterns['ins_del'] = ins_del
```

我们只是为粗体和斜体创建了一个 `MultiPattern` 类的实例，如果 `'ins_del'` 配置选项是 `True` 的话，再创建第二个 `MultiPattern` 类实例。

为了完整起见，所有最新添加的代码就像这样：

```python
STRONG_EM_RE = r'([*/]{2})(.*?)\2'
INS_DEL_RE = r'([_-]{2})(.*?)\2'

class ConfigExtension(Extension):
    def __init__(self, **kwargs):
        # 定义配置选项和默认值
        self.config = {
            'ins_del': [False, 'Enable Insert and Delete syntax.']
        }
        # 调用父类 __init__ 方法来设置选项
        super().__init__(**kwargs)

    def extendMarkdown(self, md):
        # 删除旧模式
        md.inlinePatterns.deregister('em_strong')
        md.inlinePatterns.deregister('em_strong2')
        md.inlinePatterns.deregister('not_strong')

        # 添加 STRONG_EM 模式
        strong_em = MultiPattern(STRONG_EM_RE)
        md.inlinePatterns['strong_em'] = strong_em
        # 如果激活了就添加 INS_DEL 模式
        if self.getConfig('ins_del'):
            ins_del = MultiPattern(INS_DEL_RE)
            md.inlinePatterns['ins_del'] = ins_del
```

保存更改之后，打开 Python 解释器：

```python
>>> import markdown
>>> from multiextension import ConfigExtension
>>> txt = """
... Some __underline__
... Some --strike--
... Some **bold**
... Some //italics//
... """
...
>>> # 首先把 ins_del 设为 True 试一下
>>> markdown.markdown(txt, extensions=[ConfigExtension(ins_del=True)])
"<p>Some <ins>underline</ins>\nSome <del>strike</del>\nSome <strong>bold</strong>\nSome <em>italics</em>"
>>> # 现在让 ins_del 保持默认值 False 再试一下
>>> markdown.markdown(txt, extensions=[ConfigExtension()])
"<p>Some __underline__\nSome --strike--\nSome <strong>bold</strong>\nSome <em>italics</em>"
```

## 支持扩展名（字符串）

你可能已经注意到了，每次我们测试扩展时都不得不先导入它，然后再传入一个 `Extension` 子类实例。尽管这是个调用扩展时优先考虑的方法，不过有时用户可能会在命令行或模板系统里调用 Markdown，也许还只能传入字符串。

扩展名这个特性是内建的，可以自由使用。不过用户需要知道你所定义扩展类的导入路径（Python 圆点记法）。举个例子，以上定义的三个类都可以像这样调用：

```python
>>> markdown.markdown(txt, extensions=['myextension:MyExtension'])
>>> markdown.markdown(txt, extensions=['myextension:MultiExtension'])
>>> markdown.markdown(txt, extensions=['myextension:ConfigExtension'])
```

注意这里的冒号（`:`）必须在路径和类之间使用。另外圆点（`.`）必须要在其余路径中使用。可以把它想象成是用冒号替换了 `import` 部分的 `from` 导入语句。举个例子，假设你有一个定义在 `somepackage/extensions/foo.py` 文件里的扩展类 `FooExtension`，它的导入语句是 `from somepackage.extensions.foo import FooExtension`，基于字符串的名字就是 `'somepackage.extensions.foo:FooExtension'`。

其实如果你用以上步骤创建了一个新的类而不是重构先前的，所有的三个扩展都位于相同的模块里，而且会被单独调用。这个工作好就在当你构建了一堆扩展作为一个大型项目的一部分时（可能是个 CMS、一个静态博客生成器，等等），它们会在程序内部被使用。

不过如果你打算把你的扩展作为一个独立模块分发给其他人来并入他们的项目中，你可能想要启用更短的名称支持。毫无疑问，对于你的用户来说，`'myextension'` 要比 `'myextension:MyExtension'` 更容易输入（对你来说也更容易记录）。并且因为所有内建扩展都是通过这种方式与 Python-Markdown 协作的，用户可能会期望有一致的行为。把以下代码添加到扩展的最后以启用这个特性：

```python
def makeExtension(*args, **kwargs):
    return ConfigExtension(*args, **kwargs)
```

注意这个模块级别的函数只是返回了一个 `Extension` 子类的实例。当给 Markdown 提供的是字符串时，它期望字符串使用的是 Python 圆点记法来指明可导入的模块路径。如果在字符串中没有找到冒号，它会调用模块里的 `makeExtension` 函数。

再次打开 Python 解释器测试一下扩展：

```python
>>> import markdown
>>> txt = """
... Some __underline__
... Some --strike--
... Some **bold**
... Some //italics//
... """
...
>>> markdown.markdown(txt, extensions=['myextension'])
"<p>Some __underline__\nSome --strike--\nSome <strong>bold</strong>\nSome <em>italics</em>"
```

因为我们之前使用了 `ConfigExtension`，这里可以传入一些配置选项给扩展：

```python
>>> markdown.markdown(
... 	txt,
... 	extensions=['myextension'],
... 	extension_configs = {
... 		'myextension': {'ins_del': True}
... 	}
...	)
"<p>Some <ins>underline</ins>\nSome <del>strike</del>\nSome <strong>bold</strong>\nSome <em>italics</em>"
```

注意这里我们没做任何额外工作就从 `extension_configs` 关键字得到了支持。查看文档以获取 [`extension_configs`](https://pythonhosted.org/Markdown/reference.html#extension_configs) 关键字的完整说明。

## 准备分发

因为我们创建了一个 `setup.py` 脚本，分发扩展最重要的一部分准备工作已经完成了。不过 setup 脚本还相当基础。推荐再包含多一点的元数据进去，尤其是开发者的名字、邮箱地址和项目的 URL（查看 Python 文档的 [编写 Setup 脚本](https://docs.python.org/2/distutils/setupscript.html#setup-script) 这一节为例）。另外还建议在目录里放一个最低限度的 README 和 LICENCE 文件。

现在你可以把代码提交到版本控制系统（比如 Git、Mercurial、Subversion 或 Bazaar）并上传到支持你选择系统的主机上了。然后用户就可以很容易地使用 [pip 命令](http://pip.readthedocs.org/en/latest/reference/pip_install.html#vcs-support) 来下载并安装你的扩展。

或者你也可以把项目上传到 [Python Package Index](https://pypi.python.org/pypi)，这样的话命令会更加简单一些。另外，你也可以使用一些 `setup.py` 脚本中可用的子命令（比如 `sdist`）来创建一个文件（比如 zip 或 tar）提供给你的用户下载。不过具体内容超出了这篇教程的范畴，Python 文档里的 [分发 Python 模块](https://docs.python.org/2/distutils/index.html) 还有 Setuptools 文档里的 [构建和分发包](https://pythonhosted.org/setuptools/setuptools.html) 都提供了对可用选项的说明。

## 总结

虽然这篇教程只是示范了 [内联模式](https://python-markdown.github.io/extensions/api/#inlinepatterns) 的使用，不过扩展 API 还包含有对 [Preprocessors](https://python-markdown.github.io/extensions/api/#preprocessors)、[Blockprocessors](https://python-markdown.github.io/extensions/api/#blockparser)、[Treeprocessors](https://python-markdown.github.io/extensions/api/#treeprocessors) 和 [Postprocessors](https://python-markdown.github.io/extensions/api/#postprocessors) 的支持。尽管每一种处理器都有不同的用途（运行在解析流程的不同阶段），但它们都有一个适用于所有处理器的基本原则。其实一个扩展就可以修改多个不同类型的处理器。

查看 [API 文档](https://python-markdown.github.io/extensions/api/) 还有各种内建扩展的 [源码](https://github.com/waylan/Python-Markdown) 都可以给你提供足够的信息来构建你自己的优秀扩展。当然，如果你想要一些援助，请随意在 [邮件列表](http://lists.sourceforge.net/lists/listinfo/python-markdown-discuss) 上请求帮忙。另外请不要忘了把你的扩展列在 [Wiki](https://github.com/waylan/Python-Markdown/wiki/Third-Party-Extensions) 上，以便其他人可以找到它们。
