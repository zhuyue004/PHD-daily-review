const {test,expect}=require('playwright/test');
const path=require('path');
const url=`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('about card opens the complete recorded changelog for the current version',async({page})=>{
  await page.goto(url);
  await page.getByRole('button',{name:'设置'}).click();
  await expect(page.locator('#aboutApp')).toContainText('1.2.43');
  await page.locator('#aboutApp').click();
  await expect(page.locator('#changelogModal')).toBeVisible();
  await expect(page.locator('#changelogModal')).toContainText('版本 1.2.43');
  await expect(page.locator('#changelogModal')).toContainText('版本 1.2.4');
  await expect(page.locator('#changelogModal')).toContainText('插入引用');
  await expect(page.locator('.changelog-entry')).toHaveCount(await page.evaluate(()=>window.PHD_CHANGELOG.length));
  await page.locator('#closeChangelog').click();
  await expect(page.locator('#changelogModal')).toBeHidden();
});
