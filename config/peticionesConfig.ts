const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { 'Authorization': "Bearer "+token } : {}),
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      window.location.href = '/noAcceso'; 
    }
  }

  return response;
};

export const getWithAuth = (url: string): Promise<Response> => {
  return fetchWithAuth(url, { method: 'GET' });
};

export const deleteWithAuth = (url: string): Promise<Response> => {
  return fetchWithAuth(url, { method: 'DELETE' });
};

export const postWithAuth = (url: string, data: any): Promise<Response> => {
  return fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const cerrarSesion = () =>{
  sessionStorage.clear()
  window.location.href = "/";
}

export const verificarAccesoPorPermiso = (permiso:string) => {
   const permisos = typeof window !== 'undefined' ? sessionStorage.getItem('permisos') : null;
   if(permiso == "noToken" && !token){
    return true;
   }
   if(!permisos?.includes(permiso)){
    return false;
   }
   return true;
}