package com.jobagent.auth.web.dto;

public record ExchangeRequest(String code, String redirectUri, String state) {}
