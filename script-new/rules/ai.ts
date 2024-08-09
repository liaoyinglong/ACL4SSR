export const ai = {
  name: 'ai',
  rules: [
    'DOMAIN-KEYWORD,openai',
    'DOMAIN-KEYWORD,chatgpt',
    'DOMAIN-SUFFIX,auth0.com',
    'DOMAIN-SUFFIX,challenges.cloudflare.com',
    'DOMAIN-SUFFIX,chatgpt.com',
    'DOMAIN-SUFFIX,client-api.arkoselabs.com',
    'DOMAIN-SUFFIX,events.statsigapi.net',
    'DOMAIN-SUFFIX,featuregates.org',
    'DOMAIN-SUFFIX,identrust.com',
    'DOMAIN-SUFFIX,intercom.io',
    'DOMAIN-SUFFIX,intercomcdn.com',
    'DOMAIN-SUFFIX,oaistatic.com',
    'DOMAIN-SUFFIX,oaiusercontent.com',
    'DOMAIN-SUFFIX,openai.com',
    'DOMAIN-SUFFIX,chat.openai.com',
    'DOMAIN-SUFFIX,ios.chat.openai.com',
    'DOMAIN-SUFFIX,openaiapi-site.azureedge.net',
    'DOMAIN-SUFFIX,openai.com.cdn.cloudflare.net',
    'DOMAIN-SUFFIX,ios.chat.openai.com.cdn.cloudflare.net',
    'DOMAIN-SUFFIX,sentry.io',
    'DOMAIN-SUFFIX,stripe.com',
    'DOMAIN-SUFFIX,chatgpt-async-webps-prod-centralus-1.webpubsub.azure.com',
    'DOMAIN-SUFFIX,chatgpt-async-webps-prod-eastus-1.webpubsub.azure.com',

    'DOMAIN-SUFFIX,perplexity.ai',

    // chat gpt 用了这个监控
    'DOMAIN-SUFFIX,browser-intake-datadoghq.com',
    'DOMAIN-SUFFIX,datadog.pool.ntp.org',

    // 内容：ClaudeAi
    'DOMAIN-SUFFIX,claude.ai',
    'DOMAIN-SUFFIX,anthropic.com',

    // bing
    'DOMAIN-KEYWORD,bing',
    'DOMAIN,copilot.microsoft.com',

    // google
    'DOMAIN,bard.google.com',
    'DOMAIN,gemini.google.com',
    'DOMAIN-SUFFIX,aistudio.google.com',

    // jetbrains
    'DOMAIN-SUFFIX,jetbrains.com',
    'DOMAIN-SUFFIX,grazie.ai',
    'DOMAIN-SUFFIX,grazie.aws.intellij.net',

    // 字节跳动
    'DOMAIN-SUFFIX,ciciai.com',
    'DOMAIN-SUFFIX,coze.com',

    // codeium
    'DOMAIN-SUFFIX,codeium.com',

    // poe
    'DOMAIN-SUFFIX,poe.com',
  ],
};
