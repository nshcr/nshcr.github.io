import '@/styles/common.scss';

vno.callAndListen(() => {
  if (vno.filePath !== vno.conf.paths.index) {
    return;
  }
  const itemDate = document.querySelector<HTMLElement>(".item-date");
  if (!itemDate) {
    return;
  }
  itemDate.innerText = `${vno.mainSelf.endDate} | ${vno.getMessage("lastUpdated")}`;
}, vno.EEvent.mainShown, document, true);
