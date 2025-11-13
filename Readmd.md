运行方式: 使用docker pull从阿里云镜像下载链接后，用docker pull命令运行即可，之后访问http://localhost:3000可看到前端网页

docker 镜像下载命令:
```
docker pull crpi-bpc20z7gybwjgj7w.cn-shanghai.personal.cr.aliyuncs.com/ai_travel_planner_3222487905/ai_travel_planner:1.0
```

docker run运行命令:
```
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  -p 3001:3001 \
  -e IFLYTEK_APP_ID={科大讯飞app id} \
  -e IFLYTEK_API_KEY={科大讯飞api key} \
  -e IFLYTEK_API_SECRET={科大讯飞api secret} \
  -e AMAP_API_KEY={高德地图web api key} \
  -e AI_TRAVELER_OPENAI_API_KEY={LLM api key} \
  -e OPENAI_BASE_URL={LLM base url} \
  -e OPENAI_MODEL={LLM model name} \
  ai-travel-planner:latest
```

推荐docker run命令模板:
```
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  -p 3001:3001 \
  -e IFLYTEK_APP_ID={科大讯飞app id} \
  -e IFLYTEK_API_KEY={科大讯飞api key} \
  -e IFLYTEK_API_SECRET={科大讯飞api secret} \
  -e AMAP_API_KEY={高德地图web api key} \
  -e AI_TRAVELER_OPENAI_API_KEY={LLM api key} \
  -e OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -e OPENAI_MODEL=qwen-plus \
  ai-travel-planner:latest
```

使用说明与须知:  
1. 需要向上面的命令中填充对应的api密钥信息作为环境变量运行，IFLYTEK为科大讯飞语音识别大模型api控制台的相关参数，AMAP_API_KEY为高德地图的web api参数(不是js api等)，最后的是调用大模型相关的参数，API_KEY是对应大模型的key，BASE_URL是大模型的api地址(推荐使用阿里云大模型，对应的BASE_URL参数见上)，MODEL_NAME是大模型的名称。  
2. 运行后，访问http://localhost:3000即可看到前端页面。  
3. 关于端口映射，推荐使用此处的对等映射，否则容易引起CORS跨域错误。  
