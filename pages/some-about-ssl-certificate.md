# SSL 证书类型简介

@tags: Web
@updated: 2018-03-21

一个 SSL 证书可以关联在证书限定范围内的一个或多个域名，有三种不同的证书类型。

[slice]

[toc]

## 单域名证书

单域名 SSL 证书只能保护一个子域名。

举个例子，就算你拥有 `www.example.com` 这一域名的证书，也无法保证 `mail.example.com` 域名的安全。

## 多域名证书（SAN 证书）

多域名 SSL 证书在单域名证书的基础上使用了 SAN 扩展，使其可以用一张证书覆盖多个域名。因为这个原因，这种证书一般也被叫做 SAN 证书。

你能用 SAN 扩展覆盖的域名在协议上并没有明确的限制，只要它在语法上是有效的。不限数量，可以包含通配符，也允许不同的根域名在一起。

不过证书发行机构通常会在它上面强加一些限制。

比如：

- 禁止通配符域名作为 SAN
- 限制证书能够附加的 SAN 数量
- 附加域名必须和证书域名属于同一根域名

### 主题备用名称（SAN）扩展

主题备用名称（Subject Alternative Name）扩展允许指定额外的域名到同一张 SSL 证书上，这些额外域名就叫做主题备用名称（SANs）。

## 通配符证书

通配符 SSL 证书可以覆盖单一域名的无限数量子域名。

举个例子，如果你拥有 `*.example.com` 域名的证书，那么就可以用在 `foo.example.com`、`bar.example.com` 等子域名上。不过，只能匹配和通配符同级的子域名，不能用于 `foo.else.example.com` 这样的三级域名，也不能用于根域名。

通配符证书也支持部分通配，像 `f*.example.com` 这样的域名可以只匹配 `foo.example.com`、`for.example.com` 这些域名。

不能在通配的基础上再往下开一级域名，像 `sub.*.example.com` 这样是不允许的。另外，通配符不能和 `xn--` 开头的国际化域名标签在同一级。

除上述之外，通配符 `*` 号可以出现在根域名以上任意位置，不过只允许存在一个。

通配符证书也可以用 SAN 扩展来包含其他域名或通配符。比如维基百科的 `*.wikipedia.org` 通配符证书下也有个 `*.m.wikimedia.org` 通配符域名作为 SAN。

另外，根域名也可以像这样被单独加为一个 SAN 使用。

## 参考资料

1. [SSL Certificates by Secured Domains](https://support.dnsimple.com/articles/ssl-certificates-types/#multi-domain-ssl-certificates)
2. [Wildcard certificate](https://en.wikipedia.org/wiki/Wildcard_certificate)
3. [Subject Alternative Name](https://en.wikipedia.org/wiki/Subject_Alternative_Name)
4. [What is the SSL Certificate Subject Alternative Name?](https://support.dnsimple.com/articles/what-is-ssl-san/)
