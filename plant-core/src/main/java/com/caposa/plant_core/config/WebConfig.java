package com.caposa.plant_core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Mapea la URL /fotos/ a la ruta del directorio físico que está un nivel atrás del core
        registry.addResourceHandler("/fotos/**")
                .addResourceLocations("file:../recursos/fotos/");
    }
}