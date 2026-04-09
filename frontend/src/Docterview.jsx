import React, { useState, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';



// Initialize Supabase (Use your env variables)

const supabase = createClient("SUPABASE_URL", "SUPABASE_KEY");



export default function DoctorView() {

  const [patients, setPatients] = useState([]);



  useEffect(() => {

    const fetchPatients = async () => {

      const { data } = await supabase

        .from('sessions')

        .select('*')

        .eq('is_complete', true) // Only show patients who finished triage

        .order('created_at', { ascending: false });

      setPatients(data || []);

    };



    fetchPatients();

   

    // REAL-TIME: Listen for new check-ins

    const subscription = supabase

      .channel('new-patients')

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, fetchPatients)

      .subscribe();



    return () => supabase.removeChannel(subscription);

  }, []);



  return (

    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">

          <span className="w-4 h-10 bg-red-600 rounded-full"></span>

          Live Triage Monitor

        </h1>

       

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {patients.map(p => (

            <div key={p.session_id} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 relative overflow-hidden">

              <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black text-white ${

                p.ward === 'Emergency' ? 'bg-red-600' : p.ward === 'Mental Health' ? 'bg-purple-600' : 'bg-blue-600'

              }`}>

                {p.ward.toUpperCase()}

              </div>

             

              <h3 className="text-xl font-bold text-slate-800">{p.patient_name}</h3>

              <p className="text-slate-500 text-sm mb-4">{p.patient_age} years old</p>

             

              <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">

                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Chief Complaint</p>

                <p className="text-slate-700 italic text-sm">"{p.patient_query}"</p>

              </div>



              <button className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-colors">

                Accept Patient

              </button>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}